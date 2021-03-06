(function () {
	'use strict';

	angular
		.module('todoApp')
		.controller('TodoAppController', TodoAppController);

	TodoAppController.$inject = ['todoStorage', '$sce'];

	function TodoAppController(todoStorage, $sce) {
		var vm = this,
			indexed = {};

		vm.isBootstrapped = false;

		reload(boot);

		vm.todos = [];

		vm.todoListTmpl = 'src/todo_list/templates/list.html';

		vm.todoItemTmpl = 'src/todo_list/templates/todo.html';

		vm.todoTabsTmpl = 'src/todo_list/templates/tabs.html';

		vm.currentText = '';

		vm.displayMode = 'all';

		vm.create = create;

		vm.deleteOne = deleteOne;

		vm.toggleComplete = toggleComplete;

		vm.getCssFor = getCssFor;

		vm.isTodoVisible = isVisible;

		vm.isBootstrappedAndEmpty = isBootstrappedAndEmpty;

		vm.deleteAll = deleteAll;

		vm.getEmptyText = getEmptyText;

		vm.onTodoFilesUpload = onTodoFilesUpload;

		vm.isEmpty = isEmpty;

		vm.getTabCss = getTabCss;

		vm.requestDeleteAll = requestDeleteAll;

		vm.cancelDeleteAll = cancelDeleteAll;

		function boot() {
			vm.isBootstrapped = true;
		}

		function create() {
			var text = vm.currentText;

			if (!text) return;

			return todoStorage
				.create({ text: text, html: markdown.toHTML(text) })
				.then(handleTodoCreate)
				.then(emptyInput);
		}

		function reload(cb) {
			var callback = cb || function () {};

			return todoStorage.get()
				.then(handleTodosReload)
				.then(cb);
		}

		function deleteOne(todo) {
			return todoStorage
				.deleteOne(todo.id)
				.then(handleTodoRemoval);
		}

		function deleteAll() {
			return todoStorage
				.deleteAll()
				.then(handleTodosRemoval)
				.then(cancelDeleteAll);
		}

		function requestDeleteAll() {
			vm.isDeletingAll = true;
		}

		function cancelDeleteAll() {
			vm.isDeletingAll = false;
		}

		function onTodoFilesUpload(todo) {
			replaceTodo(todo.id, todo);

			attachTodoApi(todo);
		}

		function toggleComplete(todo) {
			return todoStorage
				.update(todo.id, { complete: !todo.complete })
				.then(handleTodoUpdate);
		}

		function getEmptyText() {
			var text = 'No ' + vm.displayMode + ' todos';

			if (vm.displayMode === 'all') {
				text = 'No todos yet';
			}

			return text;
		}

		function getCssFor(todo) {

			return {
				complete: todo.complete,
				incomplete: !todo.complete
			};
		}

		function isVisible(todo) {
			var display = vm.displayMode,
				showAll = display === 'all',
				showComplete,
				showIncomplete,
				isComplete,
				todoFits;

			if (showAll) {
				return true;
			}

			isComplete 		= todo.complete;
			showComplete 	= display === 'complete';
			showIncomplete 	= display === 'incomplete';

			todoFits = (isComplete && showComplete) || (!isComplete && showIncomplete);

			return todoFits;
		}

		function emptyInput() {
			vm.currentText = '';
		}

		function isBootstrappedAndEmpty() {
			return vm.isBootstrapped && isEmpty();
		}

		function isEmpty() {
			var visibleTodos = vm.todos.filter(isVisible);

			return !visibleTodos.length;
		}

		function handleTodoCreate(newTodo) {
			vm.todos.unshift(newTodo);

			indexed[newTodo.id] = newTodo;

			attachTodoApi(newTodo);
		}

		function handleTodoUpdate(updatedTodo) {
			var id = updatedTodo.id,
				todo = indexed[id];

			if (!todo) {
				return;
			}

			replaceTodo(id, updatedTodo);

			attachTodoApi(updatedTodo);
		}

		function replaceTodo(id, updatedTodo) {
			var todo = indexed[id];

			vm.todos.splice(vm.todos.indexOf(todo), 1, updatedTodo);

			indexed[id] = updatedTodo;
		}

		function handleTodoRemoval(todo) {
			var todo = indexed[todo.id];

			vm.todos.splice(vm.todos.indexOf(todo), 1);

			delete indexed[todo.id];
		}

		function handleTodosRemoval(removedIds) {
			removedIds.forEach(function (id) {
				var todo = indexed[id],
					position = vm.todos.indexOf(todo);

				if (!!~position) {
					vm.todos.splice(position, 1);
				}

				delete indexed[id];
			});
		}

		function handleTodosReload(todos) {
			vm.todos = todos;

			indexed = _.indexBy(todos, 'id');

			todos.forEach(attachTodoApi);
		}

		function getTabCss(type) {
			return { active: vm.displayMode === type };
		}

		function attachTodoApi(todo) {
			todo.removeFile 	= removeTodoFile.bind(null, todo);
			todo.submit 		= submitTodo.bind(null, todo);
			todo.edit 			= editTodo.bind(null, todo);
			todo.html 			= typeof todo.html === 'string' ? $sce.trustAsHtml(todo.html) : todo.html;
		}

		function removeTodoFile(todo, path) {
			
			return todoStorage
				.removeTodoFile(todo.id, path)
				.then(handleTodoUpdate);
		}

		function submitTodo(todo, $event) {
			var finishEditing,
				proceed;

			proceed = $event
				? ($event.which === 10) && $event.ctrlKey
				: true;

			if (!proceed) {
				return;
			}

			finishEditing = finishTodoEditing.bind(null, todo);

			return todoStorage
				.update(todo.id, { text: todo.text, html: markdown.toHTML(todo.text) })
				.then(handleTodoUpdate)
				.then(finishEditing);
		}

		function editTodo(todo) {
			todo.isEditing = true;
		}

		function finishTodoEditing(todo) {
			todo.isEditing = false;
		}
	}
})();