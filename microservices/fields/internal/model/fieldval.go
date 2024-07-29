package model

type ID uint64

type FieldValue struct {
	TaskId  ID          `json:"taskId" validate:"required,min=1"`
	FieldId ID          `json:"fieldId" validate:"required,min=1"`
	Type    string      `json:"type,omitempty" validate:"omitempty"`
	Value   interface{} `json:"value" validate:"required"`
}

type FieldValuePrimaryKeys struct {
	TaskId  ID `json:"taskId" validate:"required,min=1"`
	FieldId ID `json:"fieldId" validate:"required,min=1"`
}
