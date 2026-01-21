-- Daily payment summary by method
SELECT
    DATE(fecha) AS fecha,
    COALESCE(SUM(CASE WHEN metodo = 'Efectivo' THEN monto ELSE 0 END), 0) AS efectivo,
    COALESCE(SUM(CASE WHEN metodo = 'Transferencia' THEN monto ELSE 0 END), 0) AS transferencias
FROM pagos
GROUP BY DATE(fecha)
ORDER BY fecha DESC;
