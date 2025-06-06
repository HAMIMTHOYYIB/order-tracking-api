const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const axios = require("axios");

const SHIPPING_API_BASE_URL = "https://shipping-api.com/app/api/v1/track-order";
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Retrieve tracking details by phone number or order ID
router.post("/get-tracking", async (req, res) => {
  const { search_input } = req.body;

  if (!search_input) {
    return res.status(400).json({ message: "Input is required" });
  }

  let searchCriteria;

  // Determine if the input is a 10-digit phone number or a 7-digit order ID
  if (/^\d{10}$/.test(search_input)) {
    searchCriteria = { consignee_phone: search_input };
  } else if (/^\d{8}$/.test(search_input)) {
    searchCriteria = { order_id: search_input };
  } else {
    return res.status(400).json({ message: "Invalid input. Please provide a 10 digit phone number or 7 digit order ID." });
  }

  try {
    const orders = await Order.find(searchCriteria);

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Cannot find any Order Try using Your phoneNumber" });
    }

    const trackingDetails = [];

    for (const order of orders) {
      if (!order.awb_number) {
        console.error(`Order ID ${order._id} is missing AWB number`);
        trackingDetails.push({
          order: {
            id: order._id,
            order_id: order.order_id,
            consignee_name: order.consignee_name,
            phoneNumber: order.consignee_phone,
            product_details: order.product_detail,
            courier_service: order.courier_service,
            orderDate: order.orderDate,
            createdAt: order.createdAt,
          },
          trackingData: { error: "Missing AWB number" },
        });
        continue;
      }

      try {
        const response = await axios.get(
          `${SHIPPING_API_BASE_URL}?awb_number=${order.awb_number}`,
          {
            headers: {
              "public-key": process.env.PUBLIC_KEY,
              "private-key": process.env.PRIVATE_KEY,
              Authorization: `Basic ${Buffer.from(
                `${process.env.PUBLIC_KEY}:${process.env.PRIVATE_KEY}`
              ).toString("base64")}`,
            },
          }
        );

        if (response.data.result === "1") {
          trackingDetails.push({
            order: {
              id: order._id,
              order_id: order.order_id,
              consignee_name: order.consignee_name,
              phoneNumber: order.consignee_phone,
              awb_number: order.awb_number,
              product_details: order.product_detail,
              courier_service: order.courier_service,
              orderDate: order.orderDate,
              createdAt: order.createdAt,
            },
            trackingData: response.data.data,
          });
        } else {
          trackingDetails.push({
            order: {
              id: order._id,
              order_id: order.order_id,
              consignee_name: order.consignee_name,
              phoneNumber: order.consignee_phone,
              awb_number: order.awb_number,
              product_details: order.product_detail,
              courier_service: order.courier_service,
              orderDate: order.orderDate,
              createdAt: order.createdAt,
            },
            trackingData: { error: response.data.message },
          });
        }
      } catch (error) {
        console.error(`Error fetching tracking for AWB ${order.awb_number}:`, error.message);
        trackingDetails.push({
          order: {
            id: order._id,
            order_id: order.order_id,
            consignee_name: order.consignee_name,
            phoneNumber: order.consignee_phone,
            awb_number: order.awb_number,
            product_details: order.product_detail,
            courier_service: order.courier_service,
            orderDate: order.orderDate,
            createdAt: order.createdAt,
          },
          trackingData: { error: "Error fetching tracking details" },
        });
      }
    }

    res.json({
      message: "Tracking details retrieved successfully",
      trackingDetails,
    });
  } catch (error) {
    console.error("Error retrieving tracking details:", error.message);
    res.status(500).json({ message: "Error retrieving tracking details" });
  }
});


// Delete tracking details by phone number
router.post("/delete-tracking", async (req, res) => {
  const { consignee_phone } = req.body;

  if (!consignee_phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  try {
    const deletedOrder = await Order.findOneAndDelete({ consignee_phone });

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found for this phone number" });
    }

    res.json({ message: "Tracking details deleted successfully" });
  } catch (error) {
    console.error("Error deleting tracking details:", error.message);
    res.status(500).json({ message: "Error deleting tracking details" });
  }
});

module.exports = router;

