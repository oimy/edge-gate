type Initializable = () => Promise<void>;

const initializables: Initializable[] = [];

const initializeServices = async () => {
    for (const initializable of initializables) {
        await initializable();
    }
};

const addServiceInitializable = (initializable: Initializable) => {
    initializables.push(initializable);
};

export default {
    initialize: initializeServices,
    addInitializable: addServiceInitializable,
};