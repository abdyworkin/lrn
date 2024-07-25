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

// CreateFieldValues implements FieldRepository.
func (p *PostgresFieldRepository) CreateFieldValues(fields []model.FieldValue) ([]model.FieldValue, error) {
	var ret []model.FieldValue

	stringFields := make([]model.FieldValue, 0, len(fields))
	numberFields := make([]model.FieldValue, 0, len(fields))
	enumFields := make([]model.FieldValue, 0, len(fields))

	for _, v := range fields {
		switch v.Type {
		case "string":
			stringFields = append(stringFields, v)
		case "number":
			numberFields = append(numberFields, v)
		case "enum":
			enumFields = append(enumFields, v)
		}
	}

	tx, err := p.store.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %s", err.Error())
	}

	if len(stringFields) > 0 {
		err = p.createFieldValues(tx, stringFields, "string_values")
		if err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	if len(numberFields) > 0 {
		err = p.createFieldValues(tx, numberFields, "number_values")
		if err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	if len(enumFields) > 0 {
		err = p.createFieldValues(tx, enumFields, "enum_values")
		if err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	err = tx.Commit()
	if err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %s", err.Error())
	}

	return ret, nil
}

// DeleteFieldValues implements FieldRepository.
func (p *PostgresFieldRepository) DeleteFieldValues(fieldIds []model.FieldValuePrimaryKeys) ([]model.FieldValue, error) {
	var fields []model.FieldValue

	tx, err := p.store.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %s", err.Error())
	}

	stringFields, err := p.deleteFieldValues(tx, fieldIds, "string", "string_values")
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	numberFields, err := p.deleteFieldValues(tx, fieldIds, "number", "number_values")
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	enumFields, err := p.deleteFieldValues(tx, fieldIds, "enum", "enum_values")
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	err = tx.Commit()
	if err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %s", err.Error())
	}

	fields = append(fields, stringFields...)
	fields = append(fields, numberFields...)
	fields = append(fields, enumFields...)

	return fields, nil
}

// GetFieldValues implements FieldRepository.
func (p *PostgresFieldRepository) GetFieldValues(fieldIds []model.FieldValuePrimaryKeys) ([]model.FieldValue, error) {
	var ret []model.FieldValue

	tx, err := p.store.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %s", err.Error())
	}

	stringFields, err := p.getFieldValues(tx, fieldIds, "string", "string_values")
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	numberFields, err := p.getFieldValues(tx, fieldIds, "number", "number_values")
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	enumFields, err := p.getFieldValues(tx, fieldIds, "enum", "enum_values")
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	err = tx.Commit()
	if err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %s", err.Error())
	}

	ret = append(ret, stringFields...)
	ret = append(ret, numberFields...)
	ret = append(ret, enumFields...)

	return ret, nil
}

// GetFieldValuesForTask implements FieldRepository.
func (p *PostgresFieldRepository) GetFieldValuesForTasks(taskIds []model.ID) ([]model.FieldValue, error) {
	var ret []model.FieldValue

	tx, err := p.store.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %s", err.Error())
	}

	stringFields, err := p.getFieldValuesForTasks(tx, taskIds, "string", "string_values")
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	numberFields, err := p.getFieldValuesForTasks(tx, taskIds, "number", "number_values")
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	enumFields, err := p.getFieldValuesForTasks(tx, taskIds, "enum", "enum_values")
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	err = tx.Commit()
	if err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %s", err.Error())
	}

	ret = append(ret, stringFields...)
	ret = append(ret, numberFields...)
	ret = append(ret, enumFields...)

	return ret, nil
}

// UpdateFieldValues implements FieldRepository.
func (p *PostgresFieldRepository) UpdateFieldValues(fields []model.FieldValue) ([]model.FieldValue, error) {
	var ret []model.FieldValue

	stringFields := make([]model.FieldValue, 0, len(fields))
	numberFields := make([]model.FieldValue, 0, len(fields))
	enumFields := make([]model.FieldValue, 0, len(fields))

	for _, v := range fields {
		switch v.Type {
		case "string":
			stringFields = append(stringFields, v)
		case "number":
			numberFields = append(numberFields, v)
		case "enum":
			enumFields = append(enumFields, v)
		}
	}

	tx, err := p.store.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %s", err.Error())
	}

	if len(stringFields) > 0 {
		updatedStringFields, err := p.updateFieldValues(tx, stringFields, "string_values")
		if err != nil {
			tx.Rollback()
			return nil, err
		}

		ret = append(ret, updatedStringFields...)
	}

	if len(numberFields) > 0 {
		updatedNumberFields, err := p.updateFieldValues(tx, numberFields, "number_values")
		if err != nil {
			tx.Rollback()
			return nil, err
		}

		ret = append(ret, updatedNumberFields...)
	}

	if len(enumFields) > 0 {
		updatedEnumFields, err := p.updateFieldValues(tx, enumFields, "enum_values")
		if err != nil {
			tx.Rollback()
			return nil, err
		}

		ret = append(ret, updatedEnumFields...)
	}

	return ret, nil
}

func (p *PostgresFieldRepository) createFieldValues(tx *sql.Tx, fields []model.FieldValue, table string) error {
	queryTemplate := "INSERT INTO %s (field_id, task_id, val) VALUES %s"

	values := []string{}

	for _, v := range fields {
		values = append(values, fmt.Sprintf("(%d, %d, %v)", v.FieldId, v.TaskId, v.Value))
	}

	valuesString := strings.Join(values, ",")

	query := fmt.Sprintf(queryTemplate, table, valuesString)

	_, err := tx.Query(query)
	if err != nil {
		return fmt.Errorf("failed create fields in %s: %s", table, err.Error())
	}

	return nil
}

func (p *PostgresFieldRepository) deleteFieldValues(tx *sql.Tx, fieldIds []model.FieldValuePrimaryKeys, typeString string, table string) ([]model.FieldValue, error) {
	queryTemplate := "DELETE FROM %s WHERE (field_id, task_id) IN (%s) RETURNING field_id, task_id, val"

	keys := []string{}
	for _, v := range fieldIds {
		keys = append(keys, fmt.Sprintf("(%d, %d)", v.FieldId, v.TaskId))
	}

	keysString := strings.Join(keys, ",")

	query := fmt.Sprintf(queryTemplate, table, keysString)

	rows, err := tx.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed deleting from %s: %s", table, err.Error())
	}

	var ret []model.FieldValue = make([]model.FieldValue, 0, len(fieldIds))

	for rows.Next() {
		var field model.FieldValue
		err = rows.Scan(&field.FieldId, &field.TaskId, &field.Value)
		if err != nil {
			return nil, fmt.Errorf("failed scan values from %s: %s", table, err.Error())
		}
		field.Type = typeString
		ret = append(ret, field)
	}

	return ret, nil
}

func (p *PostgresFieldRepository) getFieldValues(tx *sql.Tx, fieldIds []model.FieldValuePrimaryKeys, typeString string, table string) ([]model.FieldValue, error) {
	var ret []model.FieldValue

	queryTemplate := "SELECT field_id, task_id, val FROM %s WHERE (field_id, task_id) IN %s"

	keys := []string{}
	for _, v := range fieldIds {
		keys = append(keys, fmt.Sprintf("(%d, %d)", v.FieldId, v.TaskId))
	}

	keysString := strings.Join(keys, ",")

	query := fmt.Sprintf(queryTemplate, table, keysString)

	rows, err := tx.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to select from %s: %s", table, err.Error())
	}

	for rows.Next() {
		var field model.FieldValue
		err = rows.Scan(&field.FieldId, &field.TaskId, &field.Value)
		if err != nil {
			return nil, fmt.Errorf("failed to scan data from select query: %s", err.Error())
		}

		field.Type = typeString

		ret = append(ret, field)
	}

	return ret, nil
}

func (p *PostgresFieldRepository) getFieldValuesForTasks(tx *sql.Tx, taskIds []model.ID, typeString string, table string) ([]model.FieldValue, error) {
	var ret []model.FieldValue

	queryTemplate := "SELECT field_id, task_id, val FROM %s WHERE task_id IN (%s)"

	keys := []string{}
	for _, v := range taskIds {
		keys = append(keys, fmt.Sprintf("%d", v))
	}

	keysString := strings.Join(keys, ",")

	query := fmt.Sprintf(queryTemplate, table, keysString)

	rows, err := tx.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to select from %s: %s", table, err.Error())
	}

	for rows.Next() {
		var field model.FieldValue
		err = rows.Scan(&field.FieldId, &field.TaskId, &field.Value)
		if err != nil {
			return nil, fmt.Errorf("failed to scan data from select query: %s", err.Error())
		}

		field.Type = typeString

		ret = append(ret, field)
	}

	return ret, nil
}

func (p *PostgresFieldRepository) updateFieldValues(tx *sql.Tx, fields []model.FieldValue, table string) ([]model.FieldValue, error) {
	var ret []model.FieldValue

	queryTemplate := `
		WITH updated AS (
			UPDATE %s
			SET val = CASE 
				%s
			END
			WHERE (field_id, task_id) IN (%s)
			RETURNING field_id, task_id, val
		)
		SELECT field_id, task_id, val FROM updated
	`
	caseStatements := []string{}
	whereConditions := []string{}

	for _, v := range fields {
		caseStatements = append(caseStatements, fmt.Sprintf("WHEN field_id = %d AND task_id = %d THEN $%d", v.FieldId, v.TaskId, len(caseStatements)+1))
		whereConditions = append(whereConditions, fmt.Sprintf("(%d, %d)", v.FieldId, v.TaskId))
	}

	caseClause := strings.Join(caseStatements, " ")
	whereClause := strings.Join(whereConditions, ", ")

	query := fmt.Sprintf(queryTemplate, table, caseClause, whereClause)

	values := []interface{}{}
	for _, v := range fields {
		values = append(values, v.Value)
	}

	rows, err := tx.Query(query, values...)
	if err != nil {
		return nil, fmt.Errorf("failed to perform update on %s: %v", table, err)
	}

	for rows.Next() {
		var updatedField model.FieldValue
		if err := rows.Scan(&updatedField.FieldId, &updatedField.TaskId, &updatedField.Value); err != nil {
			return nil, err
		}
		ret = append(ret, updatedField)
	}

	return ret, nil
}
