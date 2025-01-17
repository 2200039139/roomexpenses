import React, { useState } from "react";
import "./RoommateExpenses.css";
import { PlusCircle } from "lucide-react";

const ExpenseSettlements = ({ expenses = [], roommates = [] }) => {
  const calculateSettlements = () => {
    if (!expenses.length || !roommates.length) {
      return [];
    }

    const activeRoommates = roommates.filter((roommate) => roommate);
    if (activeRoommates.length === 0) {
      return [];
    }

    const balances = {};
    activeRoommates.forEach((roommate) => {
      balances[roommate] = 0;
    });

    expenses.forEach((expense) => {
      if (!expense.paidBy || !expense.amount || !expense.numberOfMembers) return;

      const amount = Number(expense.amount);
      const splitAmount = amount / expense.numberOfMembers;

      balances[expense.paidBy] += amount;
      const involvedRoommates = activeRoommates.slice(0, expense.numberOfMembers);
      involvedRoommates.forEach((roommate) => {
        balances[roommate] -= splitAmount;
      });
    });

    const settlements = [];
    const epsilon = 0.01;

    while (true) {
      let maxCreditor = null;
      let maxDebtor = null;
      let maxCredit = epsilon;
      let maxDebt = epsilon;

      for (const [person, balance] of Object.entries(balances)) {
        if (balance > maxCredit) {
          maxCredit = balance;
          maxCreditor = person;
        }
        if (balance < -maxDebt) {
          maxDebt = -balance;
          maxDebtor = person;
        }
      }

      if (!maxCreditor || !maxDebtor) break;

      const settlementAmount = Math.min(maxCredit, maxDebt);

      if (settlementAmount > epsilon) {
        settlements.push({
          from: maxDebtor,
          to: maxCreditor,
          amount: Number(settlementAmount.toFixed(2)),
        });

        balances[maxCreditor] -= settlementAmount;
        balances[maxDebtor] += settlementAmount;
      } else {
        break;
      }
    }

    return settlements;
  };

  const settlements = calculateSettlements();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <div className="border-b pb-4 mb-4">
        <h2 className="text-2xl font-bold">Settlements</h2>
      </div>
      <div className="space-y-3">
        {settlements.length > 0 ? (
          settlements.map((settlement, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-red-500">{settlement.from}</span>
                <span> needs to pay </span>
                <span className="font-medium text-green-500">{settlement.to}</span>
              </div>
              <span className="font-bold">₹{settlement.amount.toFixed(2)}</span>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">
            No settlements needed - all expenses are settled!
          </p>
        )}
      </div>
    </div>
  );
};

const RoommateExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [roommates, setRoommates] = useState([""]);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    paidBy: "",
    numberOfMembers: 0,
    timestamp: new Date(),
  });

  const addRoommate = () => {
    setRoommates([...roommates, ""]);
  };

  const updateRoommate = (index, value) => {
    const updatedRoommates = [...roommates];
    updatedRoommates[index] = value;
    setRoommates(updatedRoommates);
  };

  const addExpense = () => {
    if (newExpense.description && newExpense.amount && newExpense.paidBy) {
      const activeMembers = roommates.filter((r) => r).length;
      setExpenses([
        ...expenses,
        {
          ...newExpense,
          id: Date.now(),
          numberOfMembers: activeMembers,
          timestamp: new Date(),
        },
      ]);
      setNewExpense({
        description: "",
        amount: "",
        paidBy: "",
        numberOfMembers: activeMembers,
        timestamp: new Date(),
      });
    }
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  };

  const calculatePerPersonExpense = () => {
    const expenseShares = {};
    roommates.forEach((roommate) => {
      if (roommate) {
        expenseShares[roommate] = 0;
      }
    });

    expenses.forEach((expense) => {
      const perPersonAmount = Number(expense.amount) / expense.numberOfMembers;
      const expenseRoommates = roommates.filter((r) => r).slice(0, expense.numberOfMembers);
      expenseRoommates.forEach((roommate) => {
        expenseShares[roommate] += perPersonAmount;
      });
    });

    return expenseShares;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md mb-6 p-6">
        <div className="border-b pb-4 mb-4">
          <h2 className="text-2xl font-bold">Roommate Expense Tracker (₹)</h2>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Current Roommates</h3>
            {roommates.map((roommate, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Roommate ${index + 1}`}
                  value={roommate}
                  onChange={(e) => updateRoommate(index, e.target.value)}
                />
              </div>
            ))}
            <button
              onClick={addRoommate}
              className="mt-2 flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add New Roommate
            </button>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Add New Expense</h3>
            <div className="grid gap-4">
              <input
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              />
              <div className="relative">
                <span className="absolute left-3 top-2">₹</span>
                <input
                  type="number"
                  className="w-full p-2 pl-8 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Amount"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                />
              </div>
              <select
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newExpense.paidBy}
                onChange={(e) => setNewExpense({ ...newExpense, paidBy: e.target.value })}
              >
                <option value="">Who paid?</option>
                {roommates.map((roommate, index) => (
                  roommate && (
                    <option key={index} value={roommate}>
                      {roommate}
                    </option>
                  )
                ))}
              </select>
              <button
                onClick={addExpense}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Expense
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md mb-6 p-6">
        <div className="border-b pb-4 mb-4">
          <h2 className="text-2xl font-bold">Expense Summary</h2>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Total Expenses</h3>
            <p className="text-2xl font-bold">₹{calculateTotalExpenses().toFixed(2)}</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Per Person Share</h3>
            <div className="grid gap-2">
              {Object.entries(calculatePerPersonExpense()).map(([roommate, amount]) => (
                <div key={roommate} className="flex justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">{roommate}</span>
                  <span className="font-bold">₹{amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ExpenseSettlements expenses={expenses} roommates={roommates} />
    </div>
  );
};

export default RoommateExpenses;
