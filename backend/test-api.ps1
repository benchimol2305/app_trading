# Pruebas de la API de Trading
# Uso:  powershell -ExecutionPolicy Bypass -File test-api.ps1 [-Base http://localhost:4000/api]

param(
  [string]$Base = "http://localhost:4000/api"
)

$script:pass = 0
$script:fail = 0

function Check($name, $condition) {
  if ($condition) {
    $script:pass++
    Write-Host "PASS  $name" -ForegroundColor Green
  } else {
    $script:fail++
    Write-Host "FAIL  $name" -ForegroundColor Red
  }
}

function Call($method, $path, $body, $token) {
  $headers = @{}
  if ($token) { $headers["Authorization"] = "Bearer $token" }

  $params = @{
    Method      = $method
    Uri         = "$Base$path"
    Headers     = $headers
    ContentType = "application/json"
    ErrorAction = "Stop"
  }
  if ($body) { $params["Body"] = ($body | ConvertTo-Json -Depth 6) }

  try {
    $r = Invoke-RestMethod @params
    return [pscustomobject]@{ Status = 200; Body = $r }
  } catch {
    $status = 0
    if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
    $msg = $null
    if ($_.ErrorDetails) { $msg = $_.ErrorDetails.Message }
    return [pscustomobject]@{ Status = $status; Body = $msg }
  }
}

Write-Host "`n== Pruebas API Trading ($Base) ==`n" -ForegroundColor Cyan

$stamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "tester_$stamp@trading.test"
$password = "secreto123"

# --- Salud -------------------------------------------------------------
$health = Call "GET" "/health" $null $null
Check "GET /health responde success" ($health.Body.success -eq $true)

# --- Autenticacion -----------------------------------------------------
$reg = Call "POST" "/auth/register" @{ name = "Tester"; email = $email; password = $password } $null
Check "Registro devuelve token y usuario" ($reg.Body.data.token -and $reg.Body.data.user.email -eq $email)
$token = $reg.Body.data.token

$dup = Call "POST" "/auth/register" @{ name = "Tester"; email = $email; password = $password } $null
Check "Registro duplicado devuelve 400" ($dup.Status -eq 400)

$bad = Call "POST" "/auth/login" @{ email = $email; password = "incorrecta" } $null
Check "Login con contraseña incorrecta devuelve 401" ($bad.Status -eq 401)

$login = Call "POST" "/auth/login" @{ email = $email; password = $password } $null
Check "Login correcto devuelve token" ([bool]$login.Body.data.token)

$noAuth = Call "GET" "/trades" $null $null
Check "Sin token devuelve 401" ($noAuth.Status -eq 401)

$me = Call "GET" "/users/me" $null $token
Check "GET /users/me devuelve el usuario" ($me.Body.data.email -eq $email)

$upd = Call "PUT" "/users/me" @{ name = "Tester Pro" } $token
Check "PUT /users/me actualiza el nombre" ($upd.Body.data.name -eq "Tester Pro")

# --- Aportes y retiros -------------------------------------------------
$dep1 = Call "POST" "/deposits" @{ amount = 1000; kind = "DEPOSIT"; note = "Aporte inicial"; depositedAt = "2026-01-02" } $token
Check "Crear aporte de 1000" ($dep1.Body.data.amount -eq 1000)

$dep2 = Call "POST" "/deposits" @{ amount = 500; kind = "DEPOSIT"; depositedAt = "2026-02-02" } $token
Check "Crear segundo aporte de 500" ($dep2.Body.data.amount -eq 500)

$wd = Call "POST" "/deposits" @{ amount = 200; kind = "WITHDRAWAL"; depositedAt = "2026-03-02" } $token
Check "Crear retiro de 200" ($wd.Body.data.kind -eq "WITHDRAWAL")

$depList = Call "GET" "/deposits" $null $token
Check "Listar aportes (3 movimientos)" ($depList.Body.data.Count -eq 3)
Check "Totales: neto 1300" ($depList.Body.totals.net -eq 1300)

$depUpdate = Call "PUT" "/deposits/$($dep2.Body.data._id)" @{ note = "Segundo aporte" } $token
Check "Actualizar aporte" ($depUpdate.Body.data.note -eq "Segundo aporte")

# --- Operaciones -------------------------------------------------------
$t1 = Call "POST" "/trades" @{
  symbol = "BTCUSDT"; direction = "LONG"; status = "CLOSED"; capital = 100; leverage = 1
  entryPrice = 100; exitPrice = 110; fees = 0; openedAt = "2026-01-05T10:00:00Z"; closedAt = "2026-01-05T14:00:00Z"
} $token
Check "LONG BTC +10% -> +10.00" ($t1.Body.data.resultAmount -eq 10 -and $t1.Body.data.resultPct -eq 10)

$t2 = Call "POST" "/trades" @{
  symbol = "ETHUSDT"; direction = "SHORT"; status = "CLOSED"; capital = 100; leverage = 2
  entryPrice = 100; exitPrice = 105; fees = 1; openedAt = "2026-02-10"; closedAt = "2026-02-10"
} $token
Check "SHORT ETH con apalancamiento -> -11.00 (-11%)" ($t2.Body.data.resultAmount -eq -11 -and $t2.Body.data.resultPct -eq -11)

$t3 = Call "POST" "/trades" @{
  symbol = "SOLUSDT"; direction = "LONG"; status = "CLOSED"; capital = 50
  resultAmount = 25; openedAt = "2026-02-20"; closedAt = "2026-02-20"
} $token
Check "Resultado manual -> +25.00 (50%)" ($t3.Body.data.resultAmount -eq 25 -and $t3.Body.data.resultPct -eq 50)

$t4 = Call "POST" "/trades" @{
  symbol = "AAPL"; direction = "LONG"; status = "OPEN"; capital = 300; entryPrice = 180; openedAt = "2026-03-01"
} $token
Check "Operación abierta sin resultado" ($t4.Body.data.status -eq "OPEN" -and $null -eq $t4.Body.data.resultAmount)

$noSymbol = Call "POST" "/trades" @{ capital = 10 } $token
Check "Operación sin activo devuelve 400" ($noSymbol.Status -eq 400)

$list = Call "GET" "/trades" $null $token
Check "Listar operaciones (4)" ($list.Body.count -eq 4)

$filterLong = Call "GET" "/trades?direction=LONG" $null $token
Check "Filtro direction=LONG (3)" ($filterLong.Body.count -eq 3)

$filterShort = Call "GET" "/trades?direction=SHORT" $null $token
Check "Filtro direction=SHORT (1)" ($filterShort.Body.count -eq 1)

$filterWin = Call "GET" "/trades?result=win" $null $token
Check "Filtro result=win (2)" ($filterWin.Body.count -eq 2)

$filterSymbol = Call "GET" "/trades?symbol=BTC" $null $token
Check "Filtro symbol=BTC (1)" ($filterSymbol.Body.count -eq 1)

$filterDate = Call "GET" "/trades?from=2026-02-01&to=2026-02-28" $null $token
Check "Filtro por fecha (2)" ($filterDate.Body.count -eq 2)

$one = Call "GET" "/trades/$($t1.Body.data._id)" $null $token
Check "Obtener operación por id" ($one.Body.data.symbol -eq "BTCUSDT")

$close = Call "PUT" "/trades/$($t4.Body.data._id)" @{ status = "CLOSED"; exitPrice = 198; closedAt = "2026-03-05" } $token
Check "Cerrar operación abierta (AAPL +30)" ($close.Body.data.resultAmount -eq 30 -and $close.Body.data.status -eq "CLOSED")

$notFound = Call "GET" "/trades/00000000-0000-0000-0000-000000000000" $null $token
Check "Operación inexistente devuelve 404" ($notFound.Status -eq 404)

# --- Estadisticas ------------------------------------------------------
$summary = Call "GET" "/stats/summary" $null $token
Check "Resumen: capital neto 1300" ($summary.Body.data.capital.net -eq 1300)
Check "Resumen: P&L total 54" ($summary.Body.data.pnl.total -eq 54)
Check "Resumen: 4 cerradas / 0 abiertas" ($summary.Body.data.trades.closed -eq 4 -and $summary.Body.data.trades.open -eq 0)
Check "Resumen: 3 ganadas / 1 perdida" ($summary.Body.data.trades.wins -eq 3 -and $summary.Body.data.trades.losses -eq 1)
Check "Resumen: win rate 75%" ($summary.Body.data.trades.winRate -eq 75)
Check "Resumen: profit factor 5.91" ($summary.Body.data.profitFactor -eq 5.91)
Check "Resumen: equity 1354" ($summary.Body.data.capital.equity -eq 1354)
Check "Resumen: LONG pnl 65 / SHORT pnl -11" ($summary.Body.data.long.pnl -eq 65 -and $summary.Body.data.short.pnl -eq -11)
Check "Resumen: mejor operación AAPL +30" ($summary.Body.data.best.symbol -eq "AAPL" -and $summary.Body.data.best.amount -eq 30)
Check "Resumen: peor operación ETHUSDT -11" ($summary.Body.data.worst.symbol -eq "ETHUSDT")

$summaryRange = Call "GET" "/stats/summary?from=2026-01-01&to=2026-01-31" $null $token
Check "Resumen por rango: solo 1 operación" ($summaryRange.Body.data.trades.closed -eq 1)

$equity = Call "GET" "/stats/equity" $null $token
Check "Curva de capital: 7 puntos" ($equity.Body.data.Count -eq 7)
Check "Curva de capital: equity final 1354" ($equity.Body.data[-1].equity -eq 1354)

$pnlMonth = Call "GET" "/stats/pnl?groupBy=month" $null $token
Check "P&L mensual: 3 períodos" ($pnlMonth.Body.data.Count -eq 3)
Check "P&L febrero: +14" (($pnlMonth.Body.data | Where-Object { $_.period -eq "2026-02" }).pnl -eq 14)

$pnlDay = Call "GET" "/stats/pnl?groupBy=day" $null $token
Check "P&L diario: 4 períodos" ($pnlDay.Body.data.Count -eq 4)

$pnlWeek = Call "GET" "/stats/pnl?groupBy=week" $null $token
Check "P&L semanal agrupa correctamente" ($pnlWeek.Body.data.Count -ge 3)

# --- Eliminacion -------------------------------------------------------
$delTrade = Call "DELETE" "/trades/$($t2.Body.data._id)" $null $token
Check "Eliminar operación" ($delTrade.Body.success -eq $true)

$listAfter = Call "GET" "/trades" $null $token
Check "Ya no aparece la operación eliminada (3)" ($listAfter.Body.count -eq 3)

$delDep = Call "DELETE" "/deposits/$($wd.Body.data._id)" $null $token
Check "Eliminar retiro" ($delDep.Body.success -eq $true)

$summaryAfter = Call "GET" "/stats/summary" $null $token
Check "P&L tras eliminar la pérdida: 65" ($summaryAfter.Body.data.pnl.total -eq 65)

# --- Cuenta ------------------------------------------------------------
$delUser = Call "DELETE" "/users/me" $null $token
Check "Eliminar cuenta" ($delUser.Body.success -eq $true)

$loginAfter = Call "POST" "/auth/login" @{ email = $email; password = $password } $null
Check "No se puede entrar con la cuenta eliminada" ($loginAfter.Status -eq 401)

Write-Host "`n== Resultado: $script:pass PASS / $script:fail FAIL ==`n" -ForegroundColor Cyan
if ($script:fail -gt 0) { exit 1 }
