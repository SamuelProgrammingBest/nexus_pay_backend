const mongoose = require("mongoose");
const accountSchema = require("../models/account.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const transfers = require("../models/transfer.model");

const account = mongoose.model("account", accountSchema);

const createAccount = async (req, res) => {
  try {
    const { firstName, middleName, lastName, email, NIN, PIN, password } =
      req.body;

    const NINlength = Math.floor(Math.log10(NIN) + 1);
    const PINlength = Math.floor(Math.log10(PIN) + 1);

    const existingAccount = await account.findOne({ email });
    if (existingAccount) {
      return res.status(400).send({ message: "Account already exists" });
    }

    if (NIN < 0 && NINlength !== 11) {
      return res.status(400).send({ message: "Invalid length of NIN" });
    }

    if (PIN < 0 && PINlength !== 4) {
      return res.status(400).send({ message: "Invalid length of PIN" });
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).send({ message: "Invalid email address" });
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const accountDetails = await account.create({
      firstName,
      middleName,
      lastName,
      email,
      NIN,
      PIN,
      password: hashedPass,
    });

    if (!accountDetails) {
      return res.status(400).send({ message: "Unexpected error" });
    }

    const token = jwt.sign(
      { id: accountDetails._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" },
    );

    res.status(200).send({
      message: "Successfully Created Account",
      data: { accountDetails },
      token,
    });
  } catch (error) {
    console.log(error.message);
    return res
      .status(404)
      .send({ message: "An error occurred while creating account" + error });
  }
};

const getAccount = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({
        message: "Email and password needed",
      });
    }

    const accountDetails = await account.findOne({ email });

    if (!accountDetails) {
      return res.status(400).send({
        message: "Email and password is invalid",
      });
    }

    const comparePass = await bcrypt.compare(password, accountDetails.password);

    if (!comparePass) {
      return res.status(400).send({
        message: "Email or password is invalid",
      });
    }

    const token = jwt.sign(
      { id: accountDetails._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" },
    );

    res.status(200).send({
      message: "Successfully Logged Into Account",
      data: accountDetails,
      token,
    });
  } catch (error) {
    console.log(error.message);
    return res
      .status(404)
      .send({ message: "An error occurred while logging in account" });
  }
};

const transferMoney = async (req, res) => {
  try {
    const { accountNo, amount, PIN, desc } = req.body;
    const { id } = req.user;

    if (!accountNo || !amount) {
      return res.status(400).send({
        message: "U didn't send a complete request",
      });
    }

    const accountNumber =
      typeof accountNo === "string" ? Number(accountNo) : accountNo;

    if (accountNumber <= 0 && amount <= 0) {
      return res.status(400).send({
        message: "Omo na waw for u",
      });
    }

    if (!id) {
      return res.status(400).send({
        message: "User is not allowed and is not verified",
      });
    }

    const userBalance = await account.findById({ _id: id });

    if (!userBalance) {
      return res.status(400).send({
        message: "User account not found",
      });
    }

    if (userBalance.PIN !== PIN) {
      return res.status(400).send({
        message: "Ur PIN is incorrect",
      });
    }

    if (userBalance.accountNo === accountNumber) {
      return res.status(400).send({
        message:
          "Aaaaaa I got you 😁😁😎😎 user account is the same thing na waw for u ",
      });
    }

    if (userBalance.balance < Number(amount)) {
      return res.status(400).send({
        message: "Insufficient balance ooo U no get enough mular",
        data: {
          userBalance: userBalance.balance,
          amount,
        },
      });
    }

    const userAcc = await account.findByIdAndUpdate(
      id,
      {
        balance: userBalance.balance - Number(amount),
      },
      { returnDocument: "after", runValidators: true },
    );

    const findTransferee = await account.findOne({ accountNo: accountNumber });

    if (!findTransferee) {
      return res.status(400).send({
        message: "Transferee account not found",
      });
    }

    const transferAcc = await account.findOneAndUpdate(
      { accountNo: accountNumber },
      {
        balance: findTransferee.balance + Number(amount),
      },
      { returnDocument: "after", runValidators: true },
    );

    // const balanceb4 =

    const transfer = await transfers.create({
      fromId: id,
      toId: findTransferee._id,
      desc: desc,
      amount: Number(amount),
      senderBalanceAfter: userAcc.balance,
      recieverBalanceAfter: transferAcc.balance,
    });

    const getTransfers = await transfers.find({
      fromId: id,
      toId: findTransferee._id,
    });

    if (!transfer || !transferAcc || !userAcc) {
      return res.status(400).send({
        message: "Failed transfer",
      });
    }

    return res.status(200).send({
      message: "Yay u have transferred money into someone's account",
      data: {
        transferAcc,
        userAcc,
        transfer,
        getTransfers,
      },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).send({
      message: "Unexpected error",
    });
  }
};

const getTransferHistory = async (req, res) => {
  try {
    const { id } = req.user;

    const { page } = req.query;
    const limit = 10;

    const skip = (page - 1) * limit;

    const transferHistory = await transfers
      .find({
        $or: [{ fromId: id }, { toId: id }],
      })
      .populate([
        {
          path: "fromId",
          select: "accountNo balance",
        },
        {
          path: "toId",
          select: "accountNo balance",
        },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // if (transferHistory.length === 0) {
    //   return res
    //     .status(404)
    //     .send({ message: `Be like say u no dey verified or network` });
    // }

    // const sent = transferHistory.filter(transfer => transfer.fromId._id == id)

    // let sentHtml = []

    // sent.forEach(debit => {
    //   sentHtml.push(
    //     {
    //       amount:debit.amount,
    //       account:debit.toId.accountNo
    //     }
    //   )
    // })

    // const recieved = transferHistory.filter(transfer => transfer.toId._id == id)

    // let recHtml = []

    // recieved.forEach(credit => {
    //   recHtml.push(
    //     {
    //       amount:credit.amount,
    //       account:credit.fromId.accountNo
    //     }
    //   )
    // })

    let notifications = [];

    let transactions = [];

    transferHistory.forEach((transfer) => {
      const type = transfer.fromId._id == id ? "debit" : "credit";
      const account =
        type === "debit" ? transfer.toId.accountNo : transfer.fromId.accountNo;
      const desc =
        type === "debit"
          ? `I sent ₦${transfer.amount} to ${account}`
          : `I recieved ₦${transfer.amount} from ${account}`;
      const message =
        type === "debit"
          ? `₦${transfer.amount} sent to ${account}`
          : `₦${transfer.amount} recieved from ${account}`;
      const balance =
        transfer.fromId._id == id
          ? transfer.senderBalanceAfter
          : transfer.recieverBalanceAfter;

      transactions.push({
        type: type,
        amount: transfer.amount,
        account,
        date: transfer.date.toLocaleString(),
        transactionId: transfer.transferID,
        id: transfer._id,
        desc,
        transferDesc: transfer.desc,
        balance,
      });

      notifications.push({
        userId: id,
        type,
        message,
        isRead: false,
      });
    });

    return res.status(200).send({
      message: "Gotten Transaction History",
      data: {
        transferHistory,
        transactions,
        notifications,
      },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(404).send({
      message: `An error occurred while getting transfer history 
        ${error.message}
        `,
    });
  }
};

const getOneTransfer = async (req, res) => {
  try {
    const { id } = req.user;

    const { transferId } = req.params;

    const transfer = await transfers.findById({ _id: transferId }).populate([
      { path: "fromId", select: "accountNo balance fullName" },
      { path: "toId", select: "accountNo balance fullName" },
    ]);

    if (!transfer) {
      return res.status(404).send({ message: `Be like say the id no correct` });
    }

    const transaction = {
      id:transfer._id,
      type: transfer.fromId == id ? "debit" : "credit",
      accountNo:
        transfer.fromId == id
          ? transfer.toId.accountNo
          : transfer.fromId.accountNo,
      balance:
        transfer.fromId == id
          ? transfer.senderBalanceAfter
          : transfer.recieverBalanceAfter,
      amount: transfer.amount,
      date: transfer.date.toLocaleString(),
      desc: transfer.desc,
      transactionId: transfer.transferID,
      recipientName:
        transfer.fromId == id ? transfer.toId.fullName : transfer.fromId.fullName,
    };

    return res.status(200).send({
      message: `Be like say u no dey verified or network`,
      data: {
        transfer,
        transaction,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(404).send({ message: `Error getting transfer` });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { id } = req.user;

    const userAcc = await account.findById({ _id: id });

    if (!userAcc) {
      return res.status(400).send({
        message: "User account not found",
      });
    }

    const allTransfers = await transfers.find({
      $or: [{ fromId: id }, { toId: id }],
    });

    const countAll = await transfers.countDocuments({
      $or: [{ fromId: id }, { toId: id }],
    });

    const debitTransfers = allTransfers.filter((trans) => trans.fromId == id);
    const creditTransfers = allTransfers.filter((trans) => trans.toId == id);

    const creditBalance = creditTransfers.map((trans) => trans.amount);
    const debitBalance = debitTransfers.map((trans) => trans.amount);

    const highestDebit =
      debitTransfers.length === 0 ? 0 : Math.max(...debitBalance);
    const highestCredit =
      creditTransfers.length === 0 ? 0 : Math.max(...creditBalance);

    const credits = creditBalance.reduce((acc, currentValue) => {
      return (acc += currentValue);
    }, 0);

    const debits = debitBalance.reduce((acc, currentValue) => {
      return (acc += currentValue);
    }, 0);

    const netBalance = credits - debits;

    return res.status(200).send({
      message: `Analytics gotten successfully`,
      data: {
        userAcc,
        allTransfers,
        debits,
        credits,
        highestCredit,
        highestDebit,
        netBalance,
        transNo: countAll,
        creditNo: creditTransfers.length,
        debitNo: debitTransfers.length,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(404).send({ message: `Something don sup` });
  }
};

module.exports = {
  createAccount,
  getAccount,
  transferMoney,
  getTransferHistory,
  getOneTransfer,
  getAnalytics,
};
