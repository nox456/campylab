-- Create a new order with exam details in a single transaction
WITH nueva_orden AS (
    INSERT INTO orden (id_paciente, fecha, total, estado, prioridad, observaciones, pagado)
    VALUES (
        :id_paciente,
        NOW()::DATE,
        :total,
        'creado',
        :prioridad,
        :observaciones,
        0
    )
    RETURNING id
)
INSERT INTO detalle_orden (id_orden, id_examen, precio)
SELECT
    nueva_orden.id,
    examen.id_examen,
    examen.precio
FROM nueva_orden,
     UNNEST(:examenes_ids::INTEGER[], :examenes_precios::DECIMAL[]) AS examen(id_examen, precio)
RETURNING (SELECT id FROM nueva_orden) AS id_orden;
