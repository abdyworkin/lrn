package service

import (
	"crud/internal/model"
	mock_store "crud/internal/store/mocks"
	"testing"
	"time"

	"github.com/golang/mock/gomock"
	"github.com/stretchr/testify/assert"
)

// Тестирую моки)))0

func TestService_GetTodos(t *testing.T) {
	type mockBehavior func(s *mock_store.MockTodoRepository, ids []model.ID)

	testBase := []model.Todo{
		{
			ID:        1,
			Title:     "Test todo 1",
			Complete:  false,
			CreatedAt: time.Now(),
		},
		{
			ID:        2,
			Title:     "Test todo 2",
			Complete:  false,
			CreatedAt: time.Now(),
		},
		{
			ID:        3,
			Title:     "Test todo 3",
			Complete:  true,
			CreatedAt: time.Now(),
		},
		{
			ID:        4,
			Title:     "Test todo 4",
			Complete:  true,
			CreatedAt: time.Now(),
		},
		{
			ID:        5,
			Title:     "Test todo 5",
			Complete:  false,
			CreatedAt: time.Now(),
		},
	}

	testTable := []struct {
		name           string
		args           []model.ID
		mockBehavior   mockBehavior
		expectedOutput []model.Todo
	}{
		{
			name: "Correct case 1",
			args: []model.ID{1},
			mockBehavior: func(s *mock_store.MockTodoRepository, ids []model.ID) {
				s.EXPECT().GetTodos(ids).Return(testBase[0:1], nil)
			},
			expectedOutput: testBase[0:1],
		},
		{
			name: "Correct case 2",
			args: []model.ID{1, 5},
			mockBehavior: func(s *mock_store.MockTodoRepository, ids []model.ID) {
				s.EXPECT().GetTodos(ids).Return([]model.Todo{testBase[0], testBase[4]}, nil)
			},
			expectedOutput: []model.Todo{testBase[0], testBase[4]},
		},
		{
			name: "Not found 1",
			args: []model.ID{1000},
			mockBehavior: func(s *mock_store.MockTodoRepository, ids []model.ID) {
				s.EXPECT().GetTodos(ids).Return([]model.Todo{}, nil)
			},
			expectedOutput: []model.Todo{},
		},
	}

	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	for _, tt := range testTable {
		t.Run(tt.name, func(t *testing.T) {
			repo := mock_store.NewMockTodoRepository(ctrl)
			tt.mockBehavior(repo, tt.args)

			service := &TodoService{todosRepo: repo}

			output, err := service.GetTodos(tt.args)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedOutput, output)
		})
	}
}

func TestService_CreateTodo(t *testing.T) {
	type mockBehavior func(s *mock_store.MockTodoRepository, title string)

	exampleTodoInBase := &model.Todo{ID: 1, Title: "Title 1", Complete: false, CreatedAt: time.Now()}

	testTable := []struct {
		name           string
		args           string
		mockBehavior   mockBehavior
		expectedOutput *model.Todo
	}{
		{
			name: "Correct case 1",
			args: "Title 1",
			mockBehavior: func(s *mock_store.MockTodoRepository, title string) {
				s.EXPECT().CreateTodo(title).Return(*exampleTodoInBase, nil)
			},
			expectedOutput: exampleTodoInBase,
		},
	}

	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	for _, tt := range testTable {
		t.Run(tt.name, func(t *testing.T) {
			repo := mock_store.NewMockTodoRepository(ctrl)
			tt.mockBehavior(repo, tt.args)

			service := &TodoService{todosRepo: repo}

			output, err := service.CreateTodo(tt.args)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedOutput, output)
		})
	}
}

func TestService_ToggleTodo(t *testing.T) {
	type mockBehavior func(s *mock_store.MockTodoRepository, id model.ID)

	exampleTodoInBase := &model.Todo{ID: 1, Title: "Title 1", Complete: false, CreatedAt: time.Now()}

	testTable := []struct {
		name             string
		args             model.ID
		mockBehavior     mockBehavior
		expectedComplete bool
	}{
		{
			name: "Toggle",
			args: 1,
			mockBehavior: func(s *mock_store.MockTodoRepository, id model.ID) {
				if id == 1 {
					exampleTodoInBase.Complete = !exampleTodoInBase.Complete
				}
				s.EXPECT().ToggleTodo(id).Return(*exampleTodoInBase, nil)
			},
			expectedComplete: true,
		},
	}

	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	for _, tt := range testTable {
		t.Run(tt.name, func(t *testing.T) {
			repo := mock_store.NewMockTodoRepository(ctrl)
			tt.mockBehavior(repo, tt.args)

			service := &TodoService{todosRepo: repo}

			output, err := service.ToggleTodo(tt.args)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedComplete, output.Complete)
		})
	}
}

func TestService_UpdateTodo(t *testing.T) {
	type mockBehavior func(s *mock_store.MockTodoRepository, id model.ID, title string, complete bool)

	exampleTodoInBase := &model.Todo{ID: 1, Title: "Title 1", Complete: false, CreatedAt: time.Now()}

	testTable := []struct {
		name             string
		argID            model.ID
		argTitle         string
		argComplete      bool
		mockBehavior     mockBehavior
		expectedTitle    string
		expectedComplete bool
	}{
		{
			name:        "Toggle",
			argID:       1,
			argTitle:    "New title",
			argComplete: true,
			mockBehavior: func(s *mock_store.MockTodoRepository, id model.ID, title string, complete bool) {
				exampleTodoInBase.Complete = complete
				exampleTodoInBase.Title = title
				s.EXPECT().UpdateTodo(id, &title, &complete).Return(*exampleTodoInBase, nil)
			},
			expectedTitle:    "New title",
			expectedComplete: true,
		},
	}

	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	for _, tt := range testTable {
		t.Run(tt.name, func(t *testing.T) {
			repo := mock_store.NewMockTodoRepository(ctrl)
			tt.mockBehavior(repo, tt.argID, tt.argTitle, tt.argComplete)

			service := &TodoService{todosRepo: repo}

			output, err := service.UpdateTodo(tt.argID, &tt.argTitle, &tt.argComplete)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedTitle, output.Title)
			assert.Equal(t, tt.expectedComplete, output.Complete)
		})
	}
}

func TestService_DeleteTodo(t *testing.T) {
	type mockBehavior func(s *mock_store.MockTodoRepository, id model.ID)

	exampleTodoInBase := &model.Todo{ID: 1, Title: "Title 1", Complete: false, CreatedAt: time.Now()}

	testTable := []struct {
		name             string
		argId            model.ID
		mockBehavior     mockBehavior
		expectedTitle    string
		expectedComplete bool
	}{
		{
			name:  "Toggle",
			argId: 1,
			mockBehavior: func(s *mock_store.MockTodoRepository, id model.ID) {
				s.EXPECT().DeleteTodo(id).Return(*exampleTodoInBase, nil)
			},
			expectedTitle:    "Title 1",
			expectedComplete: false,
		},
	}

	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	for _, tt := range testTable {
		t.Run(tt.name, func(t *testing.T) {
			repo := mock_store.NewMockTodoRepository(ctrl)
			tt.mockBehavior(repo, tt.argId)

			service := &TodoService{todosRepo: repo}

			output, err := service.DeleteTodo(tt.argId)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedTitle, output.Title)
			assert.Equal(t, tt.expectedComplete, output.Complete)
		})
	}
}
