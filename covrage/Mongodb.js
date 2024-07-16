import { MongoClient } from 'mongodb';

const uri = "mongodb://localhost:27017/coveredapidata";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let storeddata = "";

// Function to insert data
async function run(Data) {
    console.log("Data for store request--------->", Data);
    try {
        await client.connect();

        const database = client.db('coveredapidata');
        const collection = database.collection('mycollection');

        for (const data of Data) {
            const existingDocument = await collection.findOne({
                path: data.path,
                method: data.method,

            });

            if (existingDocument) {
                console.log(`Duplicate data found for path: ${data.path}, covered: ${data.covered}, method: ${data.method}. Skipping insertion.`);
            } else {
                const result = await collection.insertOne(data);
                console.log(`New document inserted with the following id: ${result.insertedId}`);
            }
        }
    } catch (err) {
        console.error('Error during data insertion:', err);
    } 
    finally {
        await client.close();
    }
}

export default run;

// Function to read data
async function readData() {
    try {
        await client.connect();
        const database = client.db('coveredapidata');
        const collection = database.collection('mycollection');

        const allDocs = await collection.find({}).toArray();

        // Specify the keys to keep
        const keysToKeep = ["path", "method", "covered"];

        // Filter the documents
        const filteredDocs = allDocs.map(doc => {
            const filteredDoc = {};
            keysToKeep.forEach(key => {
                if (doc[key] !== undefined) {
                    filteredDoc[key] = doc[key];
                }
            });
            return filteredDoc;
        });

        storeddata = filteredDocs;
        return filteredDocs;
    } catch (err) {
        console.error('Error during data retrieval:', err);
    } finally {
        await client.close();
    }
}

// Export the functions to use them in other files
export { readData, storeddata };
