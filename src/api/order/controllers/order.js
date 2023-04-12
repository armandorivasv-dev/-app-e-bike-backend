"use strict";
const stripe = require("stripe")("sk_test_###########");

/**
 * order controller
 */

const calcPrice = (price, discount) => {
  if (!discount) return price;
  const discountAmount = (price * discount) / 100;
  return price - discountAmount;
};

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async create(ctx) {
    const { tokenStripe, products, idUser, addressShipping } = ctx.request.body;
    let totalPayment = 0;
    products.forEach((product) => {
      totalPayment +=
        calcPrice(
          product.data.attributes.price,
          product.data.attributes.discount
        ) * product.quantity;
    });

    const charge = await stripe.charges.create({
      amount: totalPayment * 100,
      currency: "usd",
      source: tokenStripe,
      description: `ID Usuario: ${idUser}`,
    });

    const createOrder = [];

    for await (const product of products) {
      const data = {
        product: product.data.id,
        user: idUser,
        total_payment: totalPayment,
        product_payment:
          calcPrice(
            product.data.attributes.price,
            product.data.attributes.discount
          ) * product.quantity,
        product_quantity: product.quantity,
        id_payment: charge.id,
        address_shiping: addressShipping,
      };
      console.log("data", data);

      const entity = await strapi.service("api::order.order").create({ data });
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      const transformSanitizeEntity = await this.transformResponse(
        sanitizedEntity
      );
      createOrder.push(transformSanitizeEntity);
    }
    return createOrder;
  },
}));

//// CODE ORIGINALE

// 'use strict';

// /**
//  * order controller
//  */

// const { createCoreController } = require('@strapi/strapi').factories;

// module.exports = createCoreController('api::order.order');
