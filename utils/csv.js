const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');

// Generate CSV from orders data
async function generateCSV(orders) {
    const csvWriter = createObjectCsvWriter({
        path: 'orders.csv',
        header: [
            { id: '_id', title: 'Order ID' },
            { id: 'name', title: 'Name' },
            { id: 'email', title: 'Email' },
            { id: 'phone.number', title: 'Mobile'},
            { id: 'organization', title: 'Organization' },
            { id: 'studentId', title: 'Designation/Student ID' },
            { id: 'tshirt', title: 'T-Shirt Size'},
            { id: 'track', title: 'Track'},
            { id: 'workshopDetails.0.title', title: 'Workshop Title' } // Access title from populated workshop
        ]
    });

    const records = orders.map(order => ({
        _id: order._id,
        name: order.name,
        email: order.email,
        'phone.number': order.phone.number,
        organization: order.organization,
        studentId: order.studentId,
        tshirt: order.tshirt,
        track: order.track,
        'workshopDetails.0.title': order.workshopDetails?.[0]?.title ?? ''
    }));

    // Write the CSV records to a string buffer
    await csvWriter.writeRecords(records);

    // Read the CSV file and return its content
    const csvData = fs.readFileSync('orders.csv', 'utf8');

    return csvData;
}

module.exports.generateCSV = generateCSV;