const express = require('express')
const { createAccount, getAccount, transferMoney, getTransferHistory, getAnalytics, getOneTransfer } = require('../controllers/account.controllers')
const { verifyAccountHolder } = require('../middleware/protect')

const router = express.Router()

router.post("/createAccount", createAccount)
router.post("/login", getAccount)
router.post("/transferMoney", verifyAccountHolder, transferMoney)
router.get("/transferHistory", verifyAccountHolder, getTransferHistory)
router.get("/transfers/:transferId", verifyAccountHolder, getOneTransfer)
router.get("/dashboard", verifyAccountHolder, getAnalytics)
// router.get("/reverseMoney/:id", verifyAccountHolder, reverseTransfer)

module.exports = router