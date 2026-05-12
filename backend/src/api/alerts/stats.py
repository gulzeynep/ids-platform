from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.analytics import build_success_metrics, ratio, with_share
from src.core.security import get_current_user
from src.database import get_db
from src.models import Alert, BlacklistedIP, MonitoredWebsite, User

router = APIRouter(prefix="/stats", tags=["Alert Statistics"])


ACTIVE_STATUSES = ("new", "reviewing")
RESOLVED_STATUSES = ("reviewed", "false_positive")
ANALYSIS_PERIODS = {
    "week": timedelta(days=7),
    "month": timedelta(days=30),
}


async def scalar_count(db: AsyncSession, query) -> int:
    result = await db.execute(query)
    return int(result.scalar() or 0)


async def get_success_metrics(db: AsyncSession, ws_id: int, since: datetime | None = None) -> dict:
    filters = [Alert.workspace_id == ws_id]
    if since is not None:
        filters.append(Alert.timestamp >= since)

    total_alerts = await scalar_count(db, select(func.count(Alert.id)).where(*filters))
    reviewed_alerts = await scalar_count(
        db,
        select(func.count(Alert.id)).where(*filters, Alert.status == "reviewed"),
    )
    false_positive_alerts = await scalar_count(
        db,
        select(func.count(Alert.id)).where(*filters, Alert.status == "false_positive"),
    )
    active_alerts = await scalar_count(
        db,
        select(func.count(Alert.id)).where(*filters, Alert.status.in_(ACTIVE_STATUSES)),
    )
    blocked_alerts = await scalar_count(
        db,
        select(func.count(Alert.id)).where(*filters, Alert.action == "blocked"),
    )
    flagged_alerts = await scalar_count(
        db,
        select(func.count(Alert.id)).where(*filters, Alert.is_flagged.is_(True)),
    )
    critical_alerts = await scalar_count(
        db,
        select(func.count(Alert.id)).where(*filters, Alert.severity == "critical"),
    )
    resolved_critical_alerts = await scalar_count(
        db,
        select(func.count(Alert.id)).where(
            *filters,
            Alert.severity == "critical",
            Alert.status.in_(RESOLVED_STATUSES),
        ),
    )

    return build_success_metrics(
        total_alerts=total_alerts,
        reviewed_alerts=reviewed_alerts,
        false_positive_alerts=false_positive_alerts,
        active_alerts=active_alerts,
        blocked_alerts=blocked_alerts,
        flagged_alerts=flagged_alerts,
        critical_alerts=critical_alerts,
        resolved_critical_alerts=resolved_critical_alerts,
    )


@router.get("/dashboard")
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws_id = current_user.workspace_id
    now = datetime.now(timezone.utc)
    last_5m = now - timedelta(minutes=5)
    last_24h = now - timedelta(hours=24)
    previous_24h = now - timedelta(hours=48)

    active_alerts = await scalar_count(
        db,
        select(func.count(Alert.id)).where(Alert.workspace_id == ws_id, Alert.status.in_(ACTIVE_STATUSES)),
    )
    total_alerts = await scalar_count(
        db,
        select(func.count(Alert.id)).where(Alert.workspace_id == ws_id),
    )
    critical_threats = await scalar_count(
        db,
        select(func.count(Alert.id)).where(
            Alert.workspace_id == ws_id,
            Alert.severity == "critical",
            Alert.status.in_(ACTIVE_STATUSES),
        ),
    )
    resolved_alerts = await scalar_count(
        db,
        select(func.count(Alert.id)).where(Alert.workspace_id == ws_id, Alert.status == "reviewed"),
    )
    false_positive_alerts = await scalar_count(
        db,
        select(func.count(Alert.id)).where(Alert.workspace_id == ws_id, Alert.status == "false_positive"),
    )
    protected_sites = await scalar_count(
        db,
        select(func.count(MonitoredWebsite.id)).where(
            MonitoredWebsite.workspace_id == ws_id,
            MonitoredWebsite.is_active.is_(True),
        ),
    )
    blocked_ips = await scalar_count(
        db,
        select(func.count(BlacklistedIP.id)).where(BlacklistedIP.workspace_id == ws_id),
    )
    recent_alerts = await scalar_count(
        db,
        select(func.count(Alert.id)).where(Alert.workspace_id == ws_id, Alert.timestamp >= last_5m),
    )
    today_alerts = await scalar_count(
        db,
        select(func.count(Alert.id)).where(Alert.workspace_id == ws_id, Alert.timestamp >= last_24h),
    )
    previous_day_alerts = await scalar_count(
        db,
        select(func.count(Alert.id)).where(
            Alert.workspace_id == ws_id,
            Alert.timestamp >= previous_24h,
            Alert.timestamp < last_24h,
        ),
    )
    hourly_bucket = func.date_trunc("hour", Alert.timestamp).label("bucket")
    hourly_result = await db.execute(
        select(hourly_bucket, func.count(Alert.id).label("count"))
        .where(Alert.workspace_id == ws_id, Alert.timestamp >= last_24h)
        .group_by(hourly_bucket)
        .order_by(hourly_bucket)
    )
    attack_type_result = await db.execute(
        select(Alert.type, func.count(Alert.id).label("count"))
        .where(Alert.workspace_id == ws_id, Alert.timestamp >= last_24h)
        .group_by(Alert.type)
        .order_by(desc("count"))
        .limit(6)
    )
    today_attack_types = [
        {"type": row.type or "Unknown", "count": row.count}
        for row in attack_type_result
    ]

    latest_block = await db.execute(
        select(BlacklistedIP)
        .where(BlacklistedIP.workspace_id == ws_id)
        .order_by(BlacklistedIP.timestamp.desc())
        .limit(1)
    )
    mitigation = latest_block.scalars().first()

    status = "Compromised" if critical_threats > 0 else "Under Attack" if active_alerts > 0 else "Secure"

    return {
        "active_alerts": active_alerts,
        "total_alerts": total_alerts,
        "critical_threats": critical_threats,
        "resolved_alerts": resolved_alerts,
        "false_positive_alerts": false_positive_alerts,
        "protected_sites": protected_sites,
        "secured_segments": protected_sites,
        "blocked_ips": blocked_ips,
        "recent_alerts_5m": recent_alerts,
        "period": "day",
        "today_alerts": today_alerts,
        "previous_day_alerts": previous_day_alerts,
        "daily_delta": today_alerts - previous_day_alerts,
        "hourly_trend": [{"timestamp": row.bucket.isoformat(), "count": row.count} for row in hourly_result],
        "attack_type_distribution": with_share(today_attack_types, today_alerts),
        "success_metrics": await get_success_metrics(db, ws_id, last_24h),
        "active_sensors": 1,
        "status": status,
        "last_mitigation": (
            {
                "ip_address": mitigation.ip_address,
                "reason": mitigation.reason,
                "timestamp": mitigation.timestamp.isoformat(),
            }
            if mitigation
            else None
        ),
    }


@router.get("/timeseries")
async def get_timeseries(
    hours: int = Query(24, ge=1, le=168),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    bucket = func.date_trunc("hour", Alert.timestamp).label("bucket")
    result = await db.execute(
        select(bucket, func.count(Alert.id).label("count"))
        .where(Alert.workspace_id == current_user.workspace_id, Alert.timestamp >= since)
        .group_by(bucket)
        .order_by(bucket)
    )
    return [{"timestamp": row.bucket.isoformat(), "count": row.count} for row in result]


@router.get("/attack-types")
async def get_attack_type_distribution(
    hours: int | None = Query(None, ge=1, le=744),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filters = [Alert.workspace_id == current_user.workspace_id]
    if hours is not None:
        filters.append(Alert.timestamp >= datetime.now(timezone.utc) - timedelta(hours=hours))

    total = await scalar_count(db, select(func.count(Alert.id)).where(*filters))
    result = await db.execute(
        select(Alert.type, func.count(Alert.id).label("count"))
        .where(*filters)
        .group_by(Alert.type)
        .order_by(desc("count"))
    )
    return with_share([{"type": row.type or "Unknown", "count": row.count} for row in result], total)


@router.get("/severity-trend")
async def get_severity_trend(
    hours: int = Query(24, ge=1, le=168),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    bucket = func.date_trunc("hour", Alert.timestamp).label("bucket")
    result = await db.execute(
        select(bucket, Alert.severity, func.count(Alert.id).label("count"))
        .where(Alert.workspace_id == current_user.workspace_id, Alert.timestamp >= since)
        .group_by(bucket, Alert.severity)
        .order_by(bucket)
    )
    return [
        {"timestamp": row.bucket.isoformat(), "severity": row.severity, "count": row.count}
        for row in result
    ]


@router.get("/top-source-ips")
async def get_top_source_ips(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Alert.source_ip, func.count(Alert.id).label("count"))
        .where(Alert.workspace_id == current_user.workspace_id)
        .group_by(Alert.source_ip)
        .order_by(desc("count"))
        .limit(limit)
    )
    return [{"ip": row.source_ip, "count": row.count} for row in result]


@router.get("/top-signature-sids")
async def get_top_signature_sids(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Alert.signature_sid, Alert.signature_msg, func.count(Alert.id).label("count"))
        .where(Alert.workspace_id == current_user.workspace_id, Alert.signature_sid.is_not(None))
        .group_by(Alert.signature_sid, Alert.signature_msg)
        .order_by(desc("count"))
        .limit(limit)
    )
    return [
        {"sid": row.signature_sid, "signature_msg": row.signature_msg, "count": row.count}
        for row in result
    ]


@router.get("/affected-hosts")
async def get_affected_hosts(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Alert.destination_ip, func.count(Alert.id).label("count"))
        .where(Alert.workspace_id == current_user.workspace_id)
        .group_by(Alert.destination_ip)
        .order_by(desc("count"))
        .limit(limit)
    )
    return [{"host": row.destination_ip, "count": row.count} for row in result]


@router.get("/resolution-rate")
async def get_resolution_rate(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = await scalar_count(db, select(func.count(Alert.id)).where(Alert.workspace_id == current_user.workspace_id))
    reviewed = await scalar_count(
        db,
        select(func.count(Alert.id)).where(Alert.workspace_id == current_user.workspace_id, Alert.status == "reviewed"),
    )
    false_positive = await scalar_count(
        db,
        select(func.count(Alert.id)).where(
            Alert.workspace_id == current_user.workspace_id,
            Alert.status == "false_positive",
        ),
    )
    return {
        "total": total,
        "reviewed": reviewed,
        "false_positive": false_positive,
        "resolved_ratio": ratio(reviewed, total),
        "false_positive_ratio": ratio(false_positive, total),
    }


@router.get("/analysis")
async def get_analysis_stats(
    period: str = Query("week", pattern="^(week|month)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws_id = current_user.workspace_id
    now = datetime.now(timezone.utc)
    period_delta = ANALYSIS_PERIODS[period]
    period_start = now - period_delta
    previous_period_start = now - (period_delta * 2)
    filters = [Alert.workspace_id == ws_id, Alert.timestamp >= period_start]

    top_attackers_result = await db.execute(
        select(Alert.source_ip, func.count(Alert.id).label("attack_count"))
        .where(*filters)
        .group_by(Alert.source_ip)
        .order_by(desc("attack_count"))
        .limit(5)
    )
    severity_result = await db.execute(
        select(Alert.severity, func.count(Alert.id).label("count"))
        .where(*filters)
        .group_by(Alert.severity)
    )
    protocol_result = await db.execute(
        select(Alert.protocol, func.count(Alert.id).label("count"))
        .where(*filters)
        .group_by(Alert.protocol)
    )
    attack_type_result = await db.execute(
        select(Alert.type, func.count(Alert.id).label("count"))
        .where(*filters)
        .group_by(Alert.type)
        .order_by(desc("count"))
        .limit(8)
    )
    top_rule_result = await db.execute(
        select(Alert.signature_msg, Alert.signature_sid, func.count(Alert.id).label("count"))
        .where(*filters, Alert.signature_msg.is_not(None))
        .group_by(Alert.signature_msg, Alert.signature_sid)
        .order_by(desc("count"))
        .limit(1)
    )
    top_rule = top_rule_result.first()

    total_alerts = await scalar_count(db, select(func.count(Alert.id)).where(*filters))
    critical_alerts = await scalar_count(
        db,
        select(func.count(Alert.id)).where(*filters, Alert.severity == "critical"),
    )
    unique_attackers = await scalar_count(
        db,
        select(func.count(func.distinct(Alert.source_ip))).where(*filters),
    )
    current_count = await scalar_count(
        db,
        select(func.count(Alert.id)).where(*filters),
    )
    previous_count = await scalar_count(
        db,
        select(func.count(Alert.id)).where(
            Alert.workspace_id == ws_id,
            Alert.timestamp >= previous_period_start,
            Alert.timestamp < period_start,
        ),
    )
    trend_bucket = func.date_trunc("day", Alert.timestamp).label("bucket")
    trend_result = await db.execute(
        select(trend_bucket, func.count(Alert.id).label("count"))
        .where(*filters)
        .group_by(trend_bucket)
        .order_by(trend_bucket)
    )

    protocol_distribution = {row.protocol: row.count for row in protocol_result}
    protocol_total = sum(protocol_distribution.values()) or 1
    attack_type_distribution = [
        {"type": row.type or "Unknown", "count": row.count}
        for row in attack_type_result
    ]

    return {
        "period": period,
        "period_days": period_delta.days,
        "top_attackers": [{"ip": row.source_ip, "count": row.attack_count} for row in top_attackers_result],
        "severity_distribution": {row.severity: row.count for row in severity_result},
        "protocol_distribution": protocol_distribution,
        "protocol_share": {key: ratio(value, protocol_total) for key, value in protocol_distribution.items()},
        "attack_type_distribution": with_share(attack_type_distribution, total_alerts),
        "unique_attackers": unique_attackers,
        "trend_period": {
            "current": current_count,
            "previous": previous_count,
            "delta": current_count - previous_count,
        },
        "trend_24h": {
            "current": current_count,
            "previous": previous_count,
            "delta": current_count - previous_count,
        },
        "daily_trend": [{"timestamp": row.bucket.isoformat(), "count": row.count} for row in trend_result],
        "top_rule": (
            {"signature_msg": top_rule.signature_msg, "sid": top_rule.signature_sid, "count": top_rule.count}
            if top_rule
            else None
        ),
        "critical_ratio": ratio(critical_alerts, total_alerts),
        "success_metrics": await get_success_metrics(db, ws_id, period_start),
    }
