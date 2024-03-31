const Coupon = require('../models/Coupon');
const ErrorResponse = require('./errorResponse');
const { checkTimeExpiration } = require('./time');

const couponValidation = async (code, productId, next) => {
    
    const coupon = await Coupon.findOne({code});

    if(!coupon) {
        return next(
            new ErrorResponse(`${code} is an invalid coupon.`, 400)
        );
    }

    const {isAvailable, products, expiryDate, usageCount, limit } = coupon;
    const isExpired = checkTimeExpiration(expiryDate);

    const isMatched = products.includes(productId);
    const isLimitFill =  usageCount >= limit;
    
    if(!isAvailable || (!isMatched && isLimitFill) || isLimitFill || isExpired) {
        coupon.isAvailable = false;
        await coupon.save();

        return next(
            new ErrorResponse(`${code} is an invalid coupon or expired`, 400)
        );
    }

    if(!isMatched) {
        return next(
            new ErrorResponse(`${code} is an invalid coupon or expired`, 400)
        );
    }

    return coupon;
}

module.exports.couponValidation = couponValidation;