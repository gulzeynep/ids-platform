from __future__ import annotations

from typing import Any


def ratio(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        return 0.0
    return round(numerator / denominator, 4)


def with_share(items: list[dict[str, Any]], total: int, count_key: str = "count") -> list[dict[str, Any]]:
    return [
        {
            **item,
            "ratio": ratio(int(item.get(count_key, 0)), total),
        }
        for item in items
    ]


def limit_with_other(
    items: list[dict[str, Any]],
    *,
    limit: int,
    label_key: str = "type",
    count_key: str = "count",
    other_label: str = "Other",
) -> list[dict[str, Any]]:
    # Keep charts readable while preserving the hidden tail as a single bucket.
    if limit <= 0 or len(items) <= limit:
        return items

    visible_count = max(limit - 1, 0)
    visible = items[:visible_count]
    other_count = sum(int(item.get(count_key, 0)) for item in items[visible_count:])
    if other_count <= 0:
        return visible

    return [*visible, {label_key: other_label, count_key: other_count}]


def build_success_metrics(
    *,
    total_alerts: int,
    reviewed_alerts: int,
    false_positive_alerts: int,
    active_alerts: int,
    blocked_alerts: int,
    flagged_alerts: int,
    critical_alerts: int,
    resolved_critical_alerts: int,
) -> dict[str, Any]:
    triaged_alerts = reviewed_alerts + false_positive_alerts

    return {
        "total_alerts": total_alerts,
        "triaged_alerts": triaged_alerts,
        "reviewed_alerts": reviewed_alerts,
        "false_positive_alerts": false_positive_alerts,
        "active_alerts": active_alerts,
        "blocked_alerts": blocked_alerts,
        "flagged_alerts": flagged_alerts,
        "critical_alerts": critical_alerts,
        "resolved_critical_alerts": resolved_critical_alerts,
        "resolution_rate": ratio(triaged_alerts, total_alerts),
        "review_rate": ratio(reviewed_alerts, total_alerts),
        "false_positive_rate": ratio(false_positive_alerts, total_alerts),
        "backlog_rate": ratio(active_alerts, total_alerts),
        "containment_rate": ratio(blocked_alerts, total_alerts),
        "flag_rate": ratio(flagged_alerts, total_alerts),
        "critical_resolution_rate": ratio(resolved_critical_alerts, critical_alerts),
        "formulas": {
            "resolution_rate": "(reviewed + false_positive) / total_alerts",
            "review_rate": "reviewed / total_alerts",
            "false_positive_rate": "false_positive / total_alerts",
            "backlog_rate": "(new + reviewing) / total_alerts",
            "containment_rate": "blocked_actions / total_alerts",
            "critical_resolution_rate": "resolved_critical / critical_alerts",
        },
    }
