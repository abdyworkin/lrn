package model

type ID uint64

type FieldValue struct {
	TaskId  ID          `json:"taskId"`
	FieldId ID          `json:"fieldId"`
	Type    string      `json:"type"`
	Value   interface{} `json:"value"`
}

type FieldValuePrimaryKeys struct {
	TaskId  ID `json:"taskId"`
	FieldId ID `json:"fieldId"`
}
