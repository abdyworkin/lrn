CREATE TABLE IF NOT EXISTS string_values (
    field_id SERIAL NOT NULL,
    task_id SERIAL NOT NULL,
    val TEXT NOT NULL,
    CONSTRAINT pk_string_field PRIMARY KEY (field_id, task_id)
);

CREATE TABLE IF NOT EXISTS number_values (
    field_id SERIAL NOT NULL,
    task_id SERIAL NOT NULL,
    val DOUBLE PRECISION NOT NULL,
    CONSTRAINT pk_number_field PRIMARY KEY (field_id, task_id)
);

CREATE TABLE IF NOT EXISTS enum_values (
    field_id SERIAL NOT NULL,
    task_id SERIAL NOT NULL,
    val INT NOT NULL,
    CONSTRAINT pk_enum_field PRIMARY KEY (field_id, task_id)
);