$ErrorActionPreference = "Stop"

docker compose up -d --build

$docs = curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:8000/docs
if ($docs -ne "200") {
  throw "Backend /docs returned $docs"
}

$login = curl.exe -s -o NUL -w "%{http_code}" -X POST http://127.0.0.1:8000/auth/token `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -d "username=demo%40wids.local&password=DemoPass123!"
if ($login -ne "200") {
  throw "Demo login returned $login"
}

curl.exe -s -o NUL -H "Host: app.example.com" http://127.0.0.1:8080/etc/passwd

Start-Sleep -Seconds 3

$latest = docker exec ids_postgres psql -U postgres -d ids_db -t -c "select signature_msg from alerts order by id desc limit 1;"
if ($latest -notmatch "Password File Disclosure|Shadow File Access|Environment File Disclosure|SQL Union Select|Script Tag") {
  throw "No expected IDS alert found. Latest: $latest"
}

docker compose ps
