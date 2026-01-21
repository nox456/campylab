-- Consumables with stock less than 20% of original stock
SELECT
    nombre,
    SUM(stock) AS stock_actual,
    SUM(stock_inicial) AS stock_inicial,
    ROUND((SUM(stock)::DECIMAL / NULLIF(SUM(stock_inicial), 0)) * 100, 2) AS porcentaje_restante
FROM consumible
WHERE stock_inicial > 0
  AND stock < (stock_inicial * 0.20)
GROUP BY nombre
ORDER BY porcentaje_restante ASC;
