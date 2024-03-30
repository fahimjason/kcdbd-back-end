const cron = require('node-cron');
const Order = require('./models/Order');

const removePendingOrderCronJob = () => {
    cron.schedule('*/30 * * * *', async () => {
        try {
            const ordersToDelete = await Order.find({
                status: 'pending',
                timing: { $lte: new Date() },
            });
    
            if (ordersToDelete.length > 0) {
                // Iterate over each order and delete individually to trigger hooks
                for (const order of ordersToDelete) {
                    await order.remove();
                }
    
                console.log(`${ordersToDelete.length} pending orders removed.`);
            }
        } catch (error) {
            console.error('Error removing pending orders:', error);
        }
    }, {
        scheduled: true,
        timezone: 'Asia/Dhaka'
    });
};

module.exports = removePendingOrderCronJob;
