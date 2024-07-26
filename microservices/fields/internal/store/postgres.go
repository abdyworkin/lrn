package store

import (
	"database/sql"
	"fieldval/internal/model"
	"fmt"
	"log/slog"
	"strings"

	_ "github.com/lib/pq"
)

var _ Store = &PostgresStore{}

type PostgresStore struct {
	logger *slog.Logger
	config *Config
	db     *sql.DB

	fields *PostgresFieldRepository
}

func NewPostgresStore(logger *slog.Logger, config *Config) *PostgresStore {
	store := &PostgresStore{
		logger: logger,
		config: config,
	}

	fieldsRepo := newPostgresFieldRepository(store)

	store.fields = fieldsRepo

	return store
}

// Fields implements Store.
func (p *PostgresStore) Fields() FieldRepository {
	return p.fields
}

// Open implements Store.
func (p *PostgresStore) Open() error {
	db, err := sql.Open("postgres", p.config.DatabaseUrl)
	if err != nil {
		p.logger.Error("Failed to create db instance", "error", err.Error())
		return err
	}

	if err := db.Ping(); err != nil {
		p.logger.Error("Failed ping postgres server", "error", err.Error())
		return err
	}

	p.db = db

	return nil
}

// Close implements Store.
func (p *PostgresStore) Close() error {
	panic("unimplemented")
}

var _ FieldRepository = &PostgresFieldRepository{}

type PostgresFieldRepository struct {
	store *PostgresStore
}

func newPostgresFieldRepository(store *PostgresStore) *PostgresFieldRepository {
	return &PostgresFieldRepository{
		store: store,
	}
}

// Create implements FieldRepository.
func (p *PostgresFieldRepository) Create(fields []model.FieldValue) error {
	queryTemplate := `
		(INSERT INTO string_values (field_id, task_id, val) VALUES (%s))
		UNION ALL
		(INSERT INTO number_values (field_id, task_id, val) VALUES(%s))
		UNION ALL
		(INSERT INTO enum_values (field_id, task_id, val) VALUES(%s))
	`

	stringValues := make([]model.FieldValue, 0, len(fields))
	numberValues := make([]model.FieldValue, 0, len(fields))
	enumValues := make([]model.FieldValue, 0, len(fields))

	for _, v := range fields {
		switch v.Type {
		case "string":
			stringValues = append(stringValues, v)
		case "number":
			numberValues = append(numberValues, v)
		case "enum":
			enumValues = append(enumValues, v)
		}
	}

	stringValuesStr := make([]string, len(stringValues))
	numberValuesStr := make([]string, len(numberValues))
	enumValuesStr := make([]string, len(enumValues))

	for i, v := range stringValues {
		stringValuesStr[i] = fmt.Sprintf("(%d,%d,%s)", v.FieldId, v.TaskId, v.Value)
	}

	for i, v := range numberValues {
		numberValuesStr[i] = fmt.Sprintf("(%d,%d,%f)", v.FieldId, v.TaskId, v.Value)
	}

	for i, v := range enumValues {
		enumValuesStr[i] = fmt.Sprintf("(%d,%d,%d)", v.FieldId, v.TaskId, v.Value)
	}

	query := fmt.Sprintf(queryTemplate, strings.Join(stringValuesStr, ","), strings.Join(numberValuesStr, ","), strings.Join(enumValuesStr, ","))

	if err := p.store.db.QueryRow(query).Scan(); err != nil {
		return fmt.Errorf("failed to create field values: %s", err.Error())
	}

	return nil
}

// Delete implements FieldRepository.
func (p *PostgresFieldRepository) Delete(fieldIds []model.FieldValuePrimaryKeys) ([]model.FieldValue, error) {
	var fields []model.FieldValue = make([]model.FieldValue, len(fieldIds))

	queryTemplate := `
		(DELETE FROM string_values WHERE (field_id, task_id) IN (%s) RETURNING field_id, task_id, val)
		UNION ALL
		(DELETE FROM number_values WHERE (field_id, task_id) IN (%s) RETURNING field_id, task_id, val)
		UNION ALL
		(DELETE FROM enum_values WHERE (field_id, task_id) IN (%s) RETURNING field_id, task_id, val)
	`

	keys := make([]string, len(fieldIds))
	for i, v := range fieldIds {
		keys[i] = fmt.Sprintf("(%s,%s)", v.FieldId, v.TaskId)
	}
	keysString := strings.Join(keys, ",")

	query := fmt.Sprintf(queryTemplate, keysString, keysString, keysString)
	rows, err := p.store.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to delete field values: %s", err.Error())
	}

	for i := 0; rows.Next(); i++ {
		var field model.FieldValue
		err = rows.Scan(&field.FieldId, &field.TaskId, &field.Value)
		if err != nil {
			return nil, fmt.Errorf("failed to scan deleted field values: %s", err.Error())
		}

		fields[i] = field
	}

	return fields, nil
}

// Get implements FieldRepository.
func (p *PostgresFieldRepository) Get(fieldIds []model.FieldValuePrimaryKeys) ([]model.FieldValue, error) {
	ret := make([]model.FieldValue, len(fieldIds))

	queryTemplate := `
		(SELECT field_id, task_id, val FROM string_values WHERE (field_id, task_id) IN (%s))
		UNION ALL
		(SELECT field_id, task_id, val FROM number_values WHERE (field_id, task_id) IN (%s))
		UNION ALL
		(SELECT field_id, task_id, val FROM enum_values WHERE (field_id, task_id) IN (%s))
	`

	keys := make([]string, len(fieldIds))
	for i, v := range fieldIds {
		keys[i] = fmt.Sprintf("(%s,%s)", v.FieldId, v.TaskId)
	}
	keysString := strings.Join(keys, ",")

	query := fmt.Sprintf(queryTemplate, keysString, keysString, keysString)
	rows, err := p.store.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to select field values: %s", err.Error())
	}

	for i := 0; rows.Next(); i++ {
		var field model.FieldValue
		err = rows.Scan(&field.FieldId, &field.TaskId, &field.Value)
		if err != nil {
			return nil, fmt.Errorf("failed to scan selected field values: %s", err.Error())
		}

		ret[i] = field
	}

	return ret, nil
}

// GetFieldValuesForTask implements FieldRepository.
func (p *PostgresFieldRepository) GetByTaskIds(taskIds []model.ID) ([]model.FieldValue, error) {
	ret := make([]model.FieldValue, 0, len(taskIds))

	queryTemplate := `
		(SELECT field_id, task_id, val FROM string_values WHERE task_id IN (%s))
		UNION ALL
		(SELECT field_id, task_id, val FROM number_values WHERE task_id IN (%s))
		UNION ALL
		(SELECT field_id, task_id, val FROM enum_values WHERE task_id IN (%s))
	`

	keys := make([]string, len(taskIds))
	for i, v := range taskIds {
		keys[i] = fmt.Sprintf("%d", v)
	}
	keysString := strings.Join(keys, ",")

	query := fmt.Sprintf(queryTemplate, keysString, keysString, keysString)
	rows, err := p.store.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to select field values: %s", err.Error())
	}

	for i := 0; rows.Next(); i++ {
		var field model.FieldValue
		err = rows.Scan(&field.FieldId, &field.TaskId, &field.Value)
		if err != nil {
			return nil, fmt.Errorf("failed to scan selected field values: %s", err.Error())
		}

		ret[i] = field
	}

	return ret, nil
}

// Update implements FieldRepository.
func (p *PostgresFieldRepository) Update(fields []model.FieldValue) ([]model.FieldValue, error) {
	ret := make([]model.FieldValue, 0, len(fields))

	tx, err := p.store.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %s", err.Error())
	}

	stringQuery := `
		INSERT INTO string_values (field_id, task_id, val) VALUES ($1, $2, $3)
		ON CONFLICT (field_id, task_id) DO UPDATE SET val = EXCLUDED.val
		RETURNING field_id, task_id, val
	`
	numberQuery := `
		INSERT INTO number_values (field_id, task_id, val) VALUES ($1, $2, $3)
		ON CONFLICT (field_id, task_id) DO UPDATE SET val = EXCLUDED.val
		RETURNING field_id, task_id, val
	`
	enumQuery := `
		INSERT INTO enum_values (field_id, task_id, val) VALUES ($1, $2, $3)
		ON CONFLICT (field_id, task_id) DO UPDATE SET val = EXCLUDED.val
		RETURNING field_id, task_id, val
	`

	for _, field := range fields {
		var query string
		switch field.Type {
		case "string":
			query = stringQuery
		case "number":
			query = numberQuery
		case "enum":
			query = enumQuery
		default:
			return nil, fmt.Errorf("unsupported field type: %s", field.Type)
		}

		row := tx.QueryRow(query, field.FieldId, field.TaskId, field.Value)
		var updatedField model.FieldValue
		err = row.Scan(&updatedField.FieldId, &updatedField.TaskId, &updatedField.Value)
		if err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to update field values: %s", err.Error())
		}

		ret = append(ret, updatedField)
	}

	err = tx.Commit()
	if err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %s", err.Error())
	}

	return ret, nil
}

// DeleteByFields implements FieldRepository.
func (p *PostgresFieldRepository) DeleteByFields(fieldIds []model.ID) ([]model.FieldValue, error) {
	ret := make([]model.FieldValue, 0, len(fieldIds))

	queryTemplate := `
		(DELETE FROM string_values WHERE field_id IN (%s) RETURNING field_id, task_id, val)
		UNION ALL
		(DELETE FROM number_values WHERE field_id IN (%s) RETURNING field_id, task_id, val)
		UNION ALL
		(DELETE FROM enum_values WHERE field_id IN (%s) RETURNING field_id, task_id, val)
	`

	keys := make([]string, len(fieldIds))
	for i, v := range fieldIds {
		keys[i] = fmt.Sprintf("%d", v)
	}
	keysString := strings.Join(keys, ",")

	query := fmt.Sprintf(queryTemplate, keysString, keysString, keysString)
	rows, err := p.store.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to delete field values: %s", err.Error())
	}

	for i := 0; rows.Next(); i++ {
		var field model.FieldValue
		err = rows.Scan(&field.FieldId, &field.TaskId, &field.Value)
		if err != nil {
			return nil, fmt.Errorf("failed to scan deleted field values: %s", err.Error())
		}

		ret[i] = field
	}

	return ret, nil
}

// DeleteFieldvaluesByTasks implements FieldRepository.
func (p *PostgresFieldRepository) DeleteByTasks(taskIds []model.ID) ([]model.FieldValue, error) {
	ret := make([]model.FieldValue, 0, len(taskIds))

	queryTemplate := `
		(DELETE FROM string_values WHERE task_id IN (%s) RETURNING field_id, task_id, val)
		UNION ALL
		(DELETE FROM number_values WHERE task_id IN (%s) RETURNING field_id, task_id, val)
		UNION ALL
		(DELETE FROM enum_values WHERE task_id IN (%s) RETURNING field_id, task_id, val)
	`

	keys := make([]string, len(taskIds))
	for i, v := range taskIds {
		keys[i] = fmt.Sprintf("%d", v)
	}
	keysString := strings.Join(keys, ",")

	query := fmt.Sprintf(queryTemplate, keysString, keysString, keysString)
	rows, err := p.store.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to delete field values: %s", err.Error())
	}

	for i := 0; rows.Next(); i++ {
		var field model.FieldValue
		err = rows.Scan(&field.FieldId, &field.TaskId, &field.Value)
		if err != nil {
			return nil, fmt.Errorf("failed to delete selected field values: %s", err.Error())
		}

		ret[i] = field
	}

	return ret, nil
}

// GetByFields implements FieldRepository.
func (p *PostgresFieldRepository) GetByFields(fieldIds []model.ID) ([]model.FieldValue, error) {
	ret := make([]model.FieldValue, 0, len(fieldIds))

	queryTemplate := `
		(SELECT field_id, task_id, val FROM string_values WHERE field_id IN (%s))
		UNION ALL
		(SELECT field_id, task_id, val FROM number_values WHERE field_id IN (%s))
		UNION ALL
		(SELECT field_id, task_id, val FROM enum_values WHERE field_id IN (%s))
	`

	keys := make([]string, len(fieldIds))
	for i, v := range fieldIds {
		keys[i] = fmt.Sprintf("%d", v)
	}
	keysString := strings.Join(keys, ",")

	query := fmt.Sprintf(queryTemplate, keysString, keysString, keysString)
	rows, err := p.store.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to select field values: %s", err.Error())
	}

	for i := 0; rows.Next(); i++ {
		var field model.FieldValue
		err = rows.Scan(&field.FieldId, &field.TaskId, &field.Value)
		if err != nil {
			return nil, fmt.Errorf("failed to scan selected field values: %s", err.Error())
		}

		ret[i] = field
	}

	return ret, nil
}
