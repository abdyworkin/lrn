package store

import (
	"database/sql"
	"fieldval/internal/model"
	"fmt"
	"log/slog"
	"strings"

	_ "github.com/lib/pq"
)

// Я бы использовал просто JSONB для хранения значений, но раньше нужно было делать именно так
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

	tx, err := p.store.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to start transaction: %s", err.Error())
	}

	err = p.create(tx, stringValues, "string_values")
	if err != nil {
		tx.Rollback()
		return err
	}

	err = p.create(tx, numberValues, "number_values")
	if err != nil {
		tx.Rollback()
		return err
	}

	err = p.create(tx, enumValues, "enum_values")
	if err != nil {
		tx.Rollback()
		return err
	}

	err = tx.Commit()
	if err != nil {
		return fmt.Errorf("failed to commit transaction: %s", err.Error())
	}

	return nil
}

func (p *PostgresFieldRepository) create(tx *sql.Tx, fields []model.FieldValue, table string) error {
	queryTemplate := "INSERT INTO %s (field_id, task_id, val) VALUES (%s)"
	values := make([]string, len(fields))
	for i, v := range fields {
		values[i] = fmt.Sprintf("(%d,%d,%v)", v.FieldId, v.TaskId, v.Value)
	}
	query := fmt.Sprintf(queryTemplate, table, strings.Join(values, ","))
	if err := tx.QueryRow(query).Err(); err != nil {
		return fmt.Errorf("failed to insert into %s: %s", table, err.Error())
	}

	return nil
}

// Delete implements FieldRepository.
func (p *PostgresFieldRepository) Delete(fieldIds []model.FieldValuePrimaryKeys) error {
	keys := make([]string, len(fieldIds))
	for i, v := range fieldIds {
		keys[i] = fmt.Sprintf("(%s,%s)", v.FieldId, v.TaskId)
	}
	keysString := strings.Join(keys, ",")

	tx, err := p.store.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to start transaction: %s", err.Error())
	}

	err = p.delete(tx, keysString, "string_values")
	if err != nil {
		tx.Rollback()
		return err
	}

	err = p.delete(tx, keysString, "number_values")
	if err != nil {
		tx.Rollback()
		return err
	}

	err = p.delete(tx, keysString, "enum_values")
	if err != nil {
		tx.Rollback()
		return err
	}

	err = tx.Commit()
	if err != nil {
		return fmt.Errorf("failed to commit transaction: %s", err.Error())
	}

	return nil
}

func (p *PostgresFieldRepository) delete(tx *sql.Tx, fieldIdsString string, table string) error {
	queryTemplate := "DELETE FROM %s WHERE (field_id,task_id) IN (%s)"
	query := fmt.Sprintf(queryTemplate, table, fieldIdsString)
	err := tx.QueryRow(query).Err()
	if err != nil {
		return fmt.Errorf("failed to delete from %s: %s", table, err.Error())
	}
	return nil
}

// Get implements FieldRepository.
func (p *PostgresFieldRepository) Get(fieldIds []model.FieldValuePrimaryKeys) ([]model.FieldValue, error) {
	ret := make([]model.FieldValue, len(fieldIds))

	keys := make([]string, len(fieldIds))
	for i, v := range fieldIds {
		keys[i] = fmt.Sprintf("(%s,%s)", v.FieldId, v.TaskId)
	}
	keysString := strings.Join(keys, ",")

	tx, err := p.store.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %s", err.Error())
	}

	stringValues, err := p.get(tx, keysString, len(keys), "string", "string_values")
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	numberValues, err := p.get(tx, keysString, len(keys), "number", "number_values")
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	enumValues, err := p.get(tx, keysString, len(keys), "enum", "enum_values")
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	err = tx.Commit()
	if err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %s", err.Error())
	}

	ret = append(ret, stringValues...)
	ret = append(ret, numberValues...)
	ret = append(ret, enumValues...)

	return ret, nil
}

func (p *PostgresFieldRepository) get(tx *sql.Tx, fieldIdsString string, idsCount int, typeString string, table string) ([]model.FieldValue, error) {
	ret := make([]model.FieldValue, 0, idsCount)

	queryTemplate := "SELECT field_id, task_id, val FROM %s WHERE (field_id, task_id) IN (%s)"
	query := fmt.Sprintf(queryTemplate, table, fieldIdsString)
	rows, err := tx.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to select values form %s: %s", table, err.Error())
	}

	for rows.Next() {
		var field model.FieldValue
		err = rows.Scan(&field.FieldId, &field.TaskId, &field.Value)
		if err != nil {
			return nil, fmt.Errorf("failed to scan selected values from %s: %s", table, err.Error())
		}
		field.Type = typeString
		ret = append(ret, field)
	}

	return ret, nil
}

// GetFieldValuesForTask implements FieldRepository.
func (p *PostgresFieldRepository) GetByTaskIds(taskIds []model.ID) ([]model.FieldValue, error) {
	ret := make([]model.FieldValue, 0, len(taskIds))

	keys := make([]string, len(taskIds))
	for i, v := range taskIds {
		keys[i] = fmt.Sprintf("%d", v)
	}
	keysString := strings.Join(keys, ",")

	tx, err := p.store.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %s", err.Error())
	}

	stringFields, err := p.getByTaskIds(tx, keysString, len(keys), "string", "string_values")
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	numberFields, err := p.getByTaskIds(tx, keysString, len(keys), "number", "number_values")
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	enumFields, err := p.getByTaskIds(tx, keysString, len(keys), "enum", "enum_values")
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

func (p *PostgresFieldRepository) getByTaskIds(tx *sql.Tx, taskIdsString string, count int, typeString string, table string) ([]model.FieldValue, error) {
	ret := make([]model.FieldValue, 0, count)

	queryTemplate := "SELECT field_id, task_id, val FROM %s WHERE task_id IN (%s)"
	query := fmt.Sprintf(queryTemplate, table, taskIdsString)

	rows, err := tx.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to select values from %s: %s", table, err.Error())
	}

	for rows.Next() {
		var field model.FieldValue
		err = rows.Scan(&field.FieldId, &field.TaskId, &field.Value)
		if err != nil {
			return nil, fmt.Errorf("failed to scan selected values from %s: %s", table, err.Error())
		}
		field.Type = typeString
		ret = append(ret, field)
	}

	return ret, nil
}

// Update implements FieldRepository.
func (p *PostgresFieldRepository) Update(fields []model.FieldValue) error {
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
		default:
			return fmt.Errorf("unknown field type (%s), in (field_id,task_id) = (%d, %d)", v.Type, v.FieldId, v.TaskId)
		}
	}

	tx, err := p.store.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to start transaction: %s", err.Error())
	}

	err = p.update(tx, stringFields, "string_values")
	if err != nil {
		tx.Rollback()
		return err
	}

	err = p.update(tx, numberFields, "number_values")
	if err != nil {
		tx.Rollback()
		return err
	}

	err = p.update(tx, enumFields, "enum_values")
	if err != nil {
		return err
	}

	err = tx.Commit()
	if err != nil {
		return fmt.Errorf("failed to commit transaction: %s", err.Error())
	}

	return nil
}

func (p *PostgresFieldRepository) update(tx *sql.Tx, fields []model.FieldValue, table string) error {
	queryTemplate := "UPDATE %s SET val=%v WHERE (field_id,task_id) = (%d, %d)"

	for _, v := range fields {
		query := fmt.Sprint(queryTemplate, table, v.Value, v.FieldId, v.TaskId)
		err := tx.QueryRow(query).Err()
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to update field (%d, %d): %s", v.FieldId, v.TaskId, err.Error())
		}
	}

	return nil
}

// DeleteByFields implements FieldRepository.
func (p *PostgresFieldRepository) DeleteByFields(fieldIds []model.ID) error {
	keys := make([]string, len(fieldIds))
	for i, v := range fieldIds {
		keys[i] = fmt.Sprintf("%d", v)
	}
	keysString := strings.Join(keys, ",")

	tx, err := p.store.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to start transaction: %s", err.Error())
	}

	err = p.deleteByFields(tx, keysString, "string_values")
	if err != nil {
		tx.Rollback()
		return err
	}

	err = p.deleteByFields(tx, keysString, "number_values")
	if err != nil {
		tx.Rollback()
		return err
	}

	err = p.deleteByFields(tx, keysString, "enum_values")
	if err != nil {
		tx.Rollback()
		return err
	}

	err = tx.Commit()
	if err != nil {
		return fmt.Errorf("failed to commit transaction: %s", err.Error())
	}

	return nil
}

func (p *PostgresFieldRepository) deleteByFields(tx *sql.Tx, fieldIdsString string, table string) error {
	queryTemplate := "DELETE FROM %s WHERE field_id IN (%s)"
	query := fmt.Sprintf(queryTemplate, table, fieldIdsString)

	err := tx.QueryRow(query).Err()
	if err != nil {
		return fmt.Errorf("failed to delete values from %s: %s", table, err.Error())
	}

	return nil
}

// DeleteFieldvaluesByTasks implements FieldRepository.
func (p *PostgresFieldRepository) DeleteByTasks(taskIds []model.ID) error {
	keys := make([]string, len(taskIds))
	for i, v := range taskIds {
		keys[i] = fmt.Sprintf("%d", v)
	}
	keysString := strings.Join(keys, ",")

	tx, err := p.store.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to start transaction: %s", err.Error())
	}

	err = p.deleteByTasks(tx, keysString, "string_values")
	if err != nil {
		tx.Rollback()
		return err
	}

	err = p.deleteByTasks(tx, keysString, "number_values")
	if err != nil {
		tx.Rollback()
		return err
	}

	err = p.deleteByTasks(tx, keysString, "enum_values")
	if err != nil {
		tx.Rollback()
		return err
	}

	err = tx.Commit()
	if err != nil {
		return fmt.Errorf("failed to commit transaction: %s", err.Error())
	}

	return nil
}

func (p *PostgresFieldRepository) deleteByTasks(tx *sql.Tx, taskIdsString string, table string) error {
	queryTemplate := "DELETE FROM %s WHERE task_id IN (%s)"
	query := fmt.Sprintf(queryTemplate, table, taskIdsString)

	err := tx.QueryRow(query).Err()
	if err != nil {
		return fmt.Errorf("failed to delete values from %s: %s", table, err.Error())
	}

	return nil
}

// GetByFields implements FieldRepository.
func (p *PostgresFieldRepository) GetByFields(fieldIds []model.ID) ([]model.FieldValue, error) {
	ret := make([]model.FieldValue, 0, len(fieldIds))

	keys := make([]string, len(fieldIds))
	for i, v := range fieldIds {
		keys[i] = fmt.Sprintf("%d", v)
	}
	keysString := strings.Join(keys, ",")

	tx, err := p.store.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %s", err.Error())
	}

	stringFields, err := p.getByFieldIds(tx, keysString, len(keys), "string", "string_values")
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	numberFields, err := p.getByFieldIds(tx, keysString, len(keys), "number", "number_values")
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	enumFields, err := p.getByFieldIds(tx, keysString, len(keys), "enum", "enum_values")
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

func (p *PostgresFieldRepository) getByFieldIds(tx *sql.Tx, fieldIdsString string, count int, typeString string, table string) ([]model.FieldValue, error) {
	ret := make([]model.FieldValue, 0, count)

	queryTemplate := "SELECT field_id, task_id, val FROM %s WHERE field_id IN (%s)"
	query := fmt.Sprintf(queryTemplate, table, fieldIdsString)

	rows, err := tx.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to select values from %s: %s", table, err.Error())
	}

	for rows.Next() {
		var field model.FieldValue
		err = rows.Scan(&field.FieldId, &field.TaskId, &field.Value)
		if err != nil {
			return nil, fmt.Errorf("failed to scan selected values from %s: %s", table, err.Error())
		}
		field.Type = typeString
		ret = append(ret, field)
	}

	return ret, nil
}
