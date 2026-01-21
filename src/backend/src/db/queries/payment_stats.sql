-- Payment statistics summary
SELECT
    COALESCE(SUM(monto), 0) AS total_recaudado,
    COALESCE(SUM(CASE WHEN metodo = 'Efectivo' THEN monto ELSE 0 END), 0) AS efectivo,
    COALESCE(SUM(CASE WHEN metodo = 'Transferencia' THEN monto ELSE 0 END), 0) AS transferencias
FROM pagos;
