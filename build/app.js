(function () {
	'use strict';

	angular.module('core', []);
})();
(function () {
	'use strict';

	angular.module('todoList', ['core', 'ngAnimate']);
})();
(function () {
	'use strict';

	angular
		.module('core')
		.factory('uid', Uid);

	function Uid() {
		var i = 0;

		return function () {
			return i++;
		}
	}
})();
(function () {
	'use strict';

	angular
		.module('todoList')
		.controller('TodoListController', TodoListController);

	TodoListController.$inject = ['todoStorage', '$timeout'];

	function TodoListController(todoStorage, $timeout) {
		var vm = this;

		vm.currentText = '';

		vm.displayMode = 'all';

		vm.add = add;

		vm.remove = remove;

		vm.toggleComplete = toggleComplete;

		vm.getItemClasses = getItemClasses;

		vm.getTodos = getTodos;

		vm.hasNoTodos = function () {
			return !vm.getTodos().length;
		};

		vm.showAll = function () {
			vm.displayMode = 'all';
		}

		vm.showComplete = function () {
			vm.displayMode = 'complete';
		}

		vm.showIncomplete = function () {
			vm.displayMode = 'incomplete';
		}

		vm.getEmptyText = getEmptyText;

		vm.actions = [
			{ type: 'default', text: 'Show all', 		method: vm.showAll },
			{ type: 'success', text: 'Show complete', 	method: vm.showComplete },
			{ type: 'warning', text: 'Show incomplete', method: vm.showIncomplete }
		];

		function add() {
			var text = vm.currentText,
				item;

			if (!text) return;

			item = todoStorage.create(text);

			item.isBeingCreated = true;

			$timeout(function () {
				delete item.isBeingCreated;
			}, 500);

			vm.currentText = '';
		}

		function remove(id) {
			var item = todoStorage.get(id);

			item.isBeingRemoved = true;

			$timeout(function () {
				todoStorage.remove(id);
			}, 500);
		}

		function toggleComplete(id) {
			var item = todoStorage.get(id),
				mode = vm.displayMode,
				isComplete = !item.complete,
				willBeTransferred;

			willBeTransferred = (mode === 'incomplete' && isComplete) || (mode === 'complete' && !isComplete);

			if (willBeTransferred) {
				item.isBeingTransferred = true;

				$timeout(function () {
					item.complete = isComplete;
					delete item.isBeingTransferred;
				}, 800);
			} else {
				item.complete = isComplete;
			}
		}

		function getItemClasses(id) {
			var item = todoStorage.get(id),
				classes,
				animation;

			classes = {
				complete: item.complete,
				incomplete: !item.complete
			};

			if (item.isBeingRemoved) {
				animation = 'bounceOutLeft';
			} else if (item.isBeingCreated) {
				animation = 'flipInX';
			} else if (item.isBeingTransferred) {
				animation = 'flipOutX';
			}

			if (animation) {
				classes.animated = true;
				classes[animation] = true;
			}

			return classes;
		}

		function getTodos() {
			var todos = todoStorage.getAll();

			switch (vm.displayMode) {
				case 'complete':
					todos = todoStorage.getComplete();
					break;

				case 'incomplete':
					todos = todoStorage.getIncomplete();
					break;
			}

			return todos;
		}

		function getEmptyText() {
			var text = 'No ' + this.displayMode + ' todos';

			if (this.displayMode === 'all') {
				text = 'No todos yet';
			}

			return text;
		}
	}
})();
(function () {
	'use strict';

	angular
		.module('todoList')
		.factory('todoStorage', TodoStorage);

	TodoStorage.$inject = ['uid'];

	function TodoStorage(uid) {
		var items = [],
			indexedItems = {};

		return {
			getComplete: getComplete,
			getIncomplete: getIncomplete,
			getAll: getAll,
			create: create,
			remove: remove,
			get: get
		}

		function get(id) {
			return indexedItems[id] || null;
		}

		function create(text) {
			var id,
				item;

			if (!text) return;

			id = uid();

			item = {
				id: id,
				text: text,
				complete: false
			};

			items.unshift(item);

			indexedItems[id] = item;

			return item;
		}

		function remove(id) {
			var item = indexedItems[id];

			items.splice(items.indexOf(item), 1);

			delete indexedItems[id];
		}

		function getComplete() {
			return items.filter(function (item) {
				return item.complete;
			});
		}

		function getIncomplete() {
			return items.filter(function (item) {
				return !item.complete;
			});
		}

		function getAll() {
			return items;
		}
	}
})();
(function () {
	'use strict';

	angular.bootstrap(document.body, ['todoList']);	
})();