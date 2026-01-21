-- Total amount of paid orders for today
SELECT COALESCE(SUM(total), 0) AS total_income
FROM orden
WHERE fecha = NOW()::DATE
  AND estado = 'pagado';
