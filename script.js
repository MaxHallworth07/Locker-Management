document.addEventListener('DOMContentLoaded', function () {
    const areaSelect = document.getElementById('areaSelect');
    const lockersUL = document.getElementById('lockersUL');
    const peopleUL = document.getElementById('peopleUL');
    const assignedUL = document.getElementById('assignedUL');
    const addLockerButton = document.getElementById('addLockerButton');
    const addPersonButton = document.getElementById('addPersonButton');
    const assignButton = document.getElementById('assignButton');

    const API_LOCKERS = '/api/lockers';
    const API_PEOPLE = '/api/people';
    const API_ASSIGN = '/api/assign';

    let lockers = [];
    let people = [];
    let assignedPairs = [];

    function httpRequest(method, url, data, onSuccess, onError) {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    onSuccess(JSON.parse(xhr.responseText));
                } else {
                    if (onError) onError(xhr.status, xhr.responseText);
                }
            }
        };
        xhr.send(data ? JSON.stringify(data) : null);
    }

    function fetchLockers() {
        httpRequest('GET', API_LOCKERS, null, function (data) {
            lockers = data;
            renderLockers();
        });
    }

    function fetchPeople() {
        httpRequest('GET', API_PEOPLE, null, function (data) {
            people = data;
            renderPeople();
        });
    }

    function fetchAssigned() {
        httpRequest('GET', API_ASSIGN, null, function (data) {
            assigned = data;
            renderAssignedPairs
        });
    }

    function renderLockers() {
        lockersUL.innerHTML = '';
        const selectedArea = areaSelect.value;
        const filteredLockers = lockers.filter(locker => locker.area === selectedArea);

        filteredLockers.forEach(locker => {
            const listItem = document.createElement('li');
            listItem.textContent = `Locker ${locker.id}: ${locker.type}`;
            listItem.className = getLockerStatus(locker);
            lockersUL.appendChild(listItem);
        });
    }

    function renderPeople() {
        peopleUL.innerHTML = '';
        people.forEach(person => {
            const listItem = document.createElement('li');
            listItem.textContent = `Person ${person.id}: ${person.name} (${person.rota})`;
            peopleUL.appendChild(listItem);
        });
    }

    function renderAssignedPairs() {
        assignedUL.innerHTML = '';
        assignedPairs.forEach(pair => {
            const listItem = document.createElement('li');
            listItem.textContent = `Locker ${pair.locker.id} -> ${pair.person.name}`;
            assignedUL.appendChild(listItem);
        });
    }

    function getLockerStatus(locker) {
        if (!locker.userId) {
            return 'green';
        }
        const endDate = new Date(locker.endDate);
        const today = new Date();
        const timeDiff = (endDate - today) / (1000 * 60 * 60 * 24);

        if (timeDiff < 0) {
            return 'red';
        } else if (timeDiff < 14) {
            return 'orange';
        }
        return 'green';
    }

    function handleAddLocker(event) {
        event.preventDefault();
        const area = areaSelect.value;
        const type = document.getElementById('type').value;
        if (!area) {
            alert('Please select an area before adding a locker.');
            return;
        }

        const lockerData = { area, type };
        httpRequest('POST', API_LOCKERS, lockerData, function (locker) {
            lockers.push(locker);
            renderLockers();
        });
    }

    function handleAddPerson(event) {
        event.preventDefault();
        const name = document.getElementById('name').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const email = document.getElementById('email').value;
        const rota = document.getElementById('rota').value;

        const personData = { name, startDate, endDate, email, rota };
        httpRequest('POST', API_PEOPLE, personData, function (person) {
            people.push(person);
            renderPeople();
        });
    }

    function handleAssignLockers() {
        alert('Locker assignment logic will be added here.');
    }

    areaSelect.addEventListener('change', renderLockers);
    addLockerButton.addEventListener('click', handleAddLocker);
    addPersonButton.addEventListener('click', handleAddPerson);
    assignButton.addEventListener('click', handleAssignLockers);

    fetchLockers();
    fetchPeople();
    fetchAssigned();
});
