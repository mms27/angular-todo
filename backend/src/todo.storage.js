var fs = require('fs'),
    uuid = require('node-uuid'),
    _ = require('underscore'),
    STORAGE_FILE = '.todos',
    todos,
    indexed,
    initialApi,
    api;

exports.init = boot;

api = {
    readAll: readTodos,
    update: writeTodo,
    create: createTodo,
    read: readTodo,
    remove: removeTodo,
    removeAll: removeTodos,
    removeTodoFile: removeTodoFile
};

function boot(cb) {
    ensureTodosFileCreated(function () {
        readSource(function (data) {
            open();

            todos = data;
            indexed = indexBy(data, 'id');

            cb();
        })
    });
}

function open() {
    _.extend(module.exports, api);

    delete exports.init;
}

function ensureTodosFileCreated(cb) {
    fs.exists(STORAGE_FILE, function (exists) {
        if (!exists) {
            fs.writeFileSync(STORAGE_FILE, '');
        }

        cb();
    });
}

function createTodo(payload, cb) {
    var newTodo,
        id = uuid.v1();

    newTodo = {
        text: payload.text,
        html: payload.html,
        id: id,
        complete: false,
        api: {
            fileUpload: '/todos/' + id + '/files'
        },
        files: []
    };

    indexed[id] = newTodo;

    todos.unshift(newTodo);

    storeTodos(function () { cb(newTodo); });
}

function readTodos(cb) {
    cb(todos, indexed);
}

function readSource(cb) {
    fs.readFile(STORAGE_FILE, { encoding: 'utf8' }, function (err, data) {
        data = data ? JSON.parse(data) : [];

        cb(data);
    });
}

function readTodo(id, cb) {
    cb(indexed[id]);
}

function writeTodo(id, data, cb) {
    var todoToUpdate = indexed[id];

    _.extend(todoToUpdate, data);

    storeTodos(cb.bind(null, todoToUpdate));
}

function removeTodo(id, cb) {
    var todo = indexed[id];

    todos.splice(todos.indexOf(todo), 1);

    delete indexed[id];

    storeTodos(cb.bind(null, id));
}

function removeTodos(ids, cb) {
    var idsToRemove = ids || Object.keys(indexed);

    idsToRemove.forEach(function (id) {
        var todo = indexed[id],
            position;

        position = todos.indexOf(todo);

        if (!!~position) {
            todos.splice(position, 1);
        }

        delete indexed[id];
    });

    storeTodos(cb.bind(null, idsToRemove));
}

function removeTodoFile(todoId, filePath, cb) {
    var todo = indexed[todoId],
        files = todo.files,
        file;

    file = _.find(files, { path: filePath });

    files.splice(files.indexOf(file), 1);

    storeTodos(cb.bind(null, todo));
}

function storeTodos(cb) {
    fs.writeFile(STORAGE_FILE, JSON.stringify(todos), cb);
}

function indexBy(arr, key) {
    return arr.reduce(function (index, item) {
        index[item[key]] = item;

        return index;
    }, {});
}

function noop() {}