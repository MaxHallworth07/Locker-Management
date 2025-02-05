document.addEventListener('DOMContentLoaded', function () {
    const lockersUL = document.getElementById('lockersUL');
    const peopleUL = document.getElementById('peopleUL');
    const assignedUL = document.getElementById('assignedUL');
    const assignButton = document.getElementById('assignButton');
    const addLockerButton = document.getElementById('addLockerButton');
    const addPersonButton = document.getElementById('addPersonButton');

    const API_LOCKERS = '/api/lockers';
    const API_PEOPLE = '/api/people';
    const API_ASSIGN = '/api/assign';

    // Classes for Lockers, People, and Allocations
    class Locker {
        constructor(id, area, type, userId = null, endDate = null) {
            this.id = id;
            this.area = area;
            this.type = type;
            this.userId = userId;
            this.endDate = endDate;
        }
    }

    class Person {
        constructor(id, name, startDate, endDate, email, rota) {
            this.id = id;
            this.name = name;
            this.startDate = startDate;
            this.endDate = endDate;
            this.email = email;
            this.rota = rota;
        }
    }

    class Allocation {
        constructor(locker, person, dateAllocated) {
            this.locker = locker;
            this.person = person;
            this.dateAllocated = dateAllocated;
        }
    }

    let lockers = {};  
    let people = {};   
    let assignedPairs = [];  

    // Utility function for XML HTTP requests
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

    // Fetch Lockers
    function fetchLockers() {
        httpRequest('GET', API_LOCKERS, null, function (data) {
            lockers = {};
            data.forEach(lockerData => {
                const locker = new Locker(lockerData.id, lockerData.area, lockerData.type, lockerData.userId, lockerData.endDate);
                lockers[locker.id] = locker;
            });
            renderLockers();
        });
    }

    // Fetch People
    function fetchPeople() {
        httpRequest('GET', API_PEOPLE, null, function (data) {
            people = {};
            data.forEach(personData => {
                const person = new Person(personData.id, personData.name, personData.startDate, personData.endDate, personData.email, personData.rota);
                people[person.id] = person;
            });
            renderPeople();
        });
    }

    // Render Lockers List
    function renderLockers() {
        lockersUL.innerHTML = '';
        for (const lockerID in lockers) {
            const locker = lockers[lockerID];
            const listItem = document.createElement('li');
            listItem.textContent = `Locker ${locker.id}: ${locker.area} - ${locker.type}`;
            listItem.className = getLockerStatus(locker);
            lockersUL.appendChild(listItem);
        }
    }

    // Render People List
    function renderPeople() {
        peopleUL.innerHTML = '';
        for (const personID in people) {
            const person = people[personID];
            const listItem = document.createElement('li');
            listItem.textContent = `Person ${person.id}: ${person.name} (${person.rota})`;
            peopleUL.appendChild(listItem);
        }
    }

    // Render Assigned Pairs
    function renderAssignedPairs() {
        assignedUL.innerHTML = '';
        assignedPairs.forEach(pair => {
            const listItem = document.createElement('li');
            listItem.textContent = `Locker ${pair.locker.id} -> ${pair.person.name} (Assigned on ${pair.dateAllocated})`;
            assignedUL.appendChild(listItem);
        });
    }

    // Determine Locker Status for CSS
    function getLockerStatus(locker) {
        if (!locker.userId) {
            return 'green'; // Available
        }
        const endDate = new Date(locker.endDate);
        const today = new Date();
        const timeDiff = (endDate - today) / (1000 * 60 * 60 * 24); // Convert to days

        if (timeDiff < 0) {
            return 'red'; // Expired
        } else if (timeDiff < 14) {
            return 'orange'; // Expiring soon
        }
        return 'green'; // In use
    }

    // Handle Adding a Locker
    function handleAddLocker(event) {
        event.preventDefault();

        const area = document.getElementById('area').value;
        const type = document.getElementById('type').value;

        const lockerData = { area, type };

        httpRequest('POST', API_LOCKERS, lockerData, function (lockerResponse) {
            const locker = new Locker(lockerResponse.id, lockerResponse.area, lockerResponse.type);
            lockers[locker.id] = locker;
            renderLockers();
        }, function (status, response) {
            alert(`Error adding locker: ${response}`);
        });
    }

    // Handle Adding a Person
    function handleAddPerson(event) {
        event.preventDefault();

        const name = document.getElementById('name').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value || new Date().toISOString().split('T')[0]; // Default to today
        const email = document.getElementById('email').value;
        const rota = document.getElementById('room').value;

        const personData = { name, startDate, endDate, email, rota };

        httpRequest('POST', API_PEOPLE, personData, function (personResponse) {
            const person = new Person(personResponse.id, personResponse.name, personResponse.startDate, personResponse.endDate, personResponse.email, personResponse.rota);
            people[person.id] = person;
            renderPeople();
        }, function (status, response) {
            alert(`Error adding person: ${response}`);
        });
    }

    // Assign a Locker to an Unassigned Person
    function handleAssignLockers() {
        const availableLockers = Object.values(lockers).filter(locker => !locker.userId);
        const unassignedPeople = Object.values(people).filter(person => !Object.values(lockers).some(l => l.userId === person.id));

        if (availableLockers.length > 0 && unassignedPeople.length > 0) {
            const locker = availableLockers[0];
            const person = unassignedPeople[0];

            const assignData = { locker_id: locker.id, person_id: person.id };

            httpRequest('POST', API_ASSIGN, assignData, function () {
                locker.userId = person.id;
                assignedPairs.push(new Allocation(locker, person, new Date().toLocaleDateString()));
                renderAssignedPairs();
                renderLockers();
                renderPeople();
            }, function (status, response) {
                alert(`Error assigning locker: ${response}`);
            });
        } else {
            alert('No available lockers or unassigned people.');
        }
    }

    // Event Listeners
    addLockerButton.addEventListener('click', handleAddLocker);
    addPersonButton.addEventListener('click', handleAddPerson);
    assignButton.addEventListener('click', handleAssignLockers);

    // Initial Load
    fetchLockers();
    fetchPeople();
});
