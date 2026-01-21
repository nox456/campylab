SELECT
    o.id,
    p.nombre AS paciente_nombre,
    p.cedula AS paciente_cedula,
    o.fecha,
    o.prioridad,
    o.estado,
    o.total,
    (o.total - o.pagado) AS balance
FROM orden o
INNER JOIN pacientes p ON o.id_paciente = p.id
ORDER BY o.fecha DESC, o.id DESC;
