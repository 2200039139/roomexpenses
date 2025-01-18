import React, { useState, useEffect } from "react";
import "./RoommateExpenses.css";
import { PlusCircle, CheckCircle, History } from "lucide-react";

// Constants
const STORAGE_KEYS = {
  EXPENSES: 'roommate_expenses',
  ROOMMATES: 'roommate_list',
  SETTLED_PAYMENTS: 'settled_payments'
};

const CURRENCY = {
  SYMBOL: '₹',
  LOCALE: 'en-IN'
};

// Local Storage Helper Functions
const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const getFromLocalStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

// Utility Functions
const formatCurrency = (amount) => {
  return `${CURRENCY.SYMBOL}${Number(amount).toFixed(2)}`;
};

const formatDateTime = (date) => {
  const dateObj = new Date(date);
  return `${dateObj.toLocaleDateString()} at ${dateObj.toLocaleTimeString()}`;
};

// Input Components
const CurrencyInput = ({ value, onChange, placeholder }) => (
  <div className="relative">
    <span className="absolute left-3 top-2">{CURRENCY.SYMBOL}</span>
    <input
      type="number"
      className="w-full p-2 pl-8 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const RoommateExpenses = () => {
  // State Management
  const [expenses, setExpenses] = useState(() => 
    getFromLocalStorage(STORAGE_KEYS.EXPENSES, [])
  );
  const [roommates, setRoommates] = useState(() => 
    getFromLocalStorage(STORAGE_KEYS.ROOMMATES, [""])
  );
  const [settledPayments, setSettledPayments] = useState(() => 
    getFromLocalStorage(STORAGE_KEYS.SETTLED_PAYMENTS, [])
  );
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    paidBy: "",
    numberOfMembers: 0,
    timestamp: new Date(),
  });

  // Persist state changes to localStorage
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.EXPENSES, expenses);
  }, [expenses]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.ROOMMATES, roommates);
  }, [roommates]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.SETTLED_PAYMENTS, settledPayments);
  }, [settledPayments]);

  // Roommate Management
  const addRoommate = () => {
    setRoommates([...roommates, ""]);
  };

  const updateRoommate = (index, value) => {
    const updatedRoommates = [...roommates];
    updatedRoommates[index] = value;
    setRoommates(updatedRoommates);
  };

  // Expense Management
  const addExpense = () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.paidBy) {
      return;
    }

    const activeMembers = roommates.filter(r => r).length;
    setExpenses(prev => [
      ...prev,
      {
        ...newExpense,
        id: Date.now(),
        numberOfMembers: activeMembers,
        timestamp: new Date(),
        amount: Number(newExpense.amount)
      },
    ]);

    setNewExpense({
      description: "",
      amount: "",
      paidBy: "",
      numberOfMembers: activeMembers,
      timestamp: new Date(),
    });
  };

  // Calculations
  const calculateTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  };

  const calculatePerPersonExpense = () => {
    const expenseShares = {};
    const activeRoommates = roommates.filter(r => r);
    
    activeRoommates.forEach(roommate => {
      expenseShares[roommate] = 0;
    });

    expenses.forEach(expense => {
      const perPersonAmount = expense.amount / expense.numberOfMembers;
      const expenseRoommates = activeRoommates.slice(0, expense.numberOfMembers);
      
      expenseRoommates.forEach(roommate => {
        expenseShares[roommate] += perPersonAmount;
      });
    });

    return expenseShares;
  };

  // Get unique months for filtering
  const getUniqueMonths = () => {
    const months = expenses.map(expense => {
      const date = new Date(expense.timestamp);
      return `${date.getFullYear()}-${date.getMonth()}`;
    });
    
    return [...new Set(months)]
      .map(monthStr => {
        const [year, month] = monthStr.split('-');
        return new Date(parseInt(year), parseInt(month));
      })
      .sort((a, b) => b - a);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Roommates Section */}
      <div className="bg-white rounded-lg shadow-md mb-6 p-6">
        <div className="border-b pb-4 mb-4">
          <h2 className="text-2xl font-bold">Roommate Expense Tracker ({CURRENCY.SYMBOL})</h2>
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

          {/* New Expense Form */}
          <div>
            <h3 className="text-lg font-medium mb-2">Add New Expense</h3>
            <div className="grid gap-4">
              <input
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              />
              <CurrencyInput
                value={newExpense.amount}
                onChange={(value) => setNewExpense({ ...newExpense, amount: value })}
                placeholder="Amount"
              />
              <select
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newExpense.paidBy}
                onChange={(e) => setNewExpense({ ...newExpense, paidBy: e.target.value })}
              >
                <option value="">Who paid?</option>
                {roommates.filter(r => r).map((roommate, index) => (
                  <option key={index} value={roommate}>
                    {roommate}
                  </option>
                ))}
              </select>
              <button
                onClick={addExpense}
                disabled={!newExpense.description || !newExpense.amount || !newExpense.paidBy}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Expense
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expense History */}
      <div className="bg-white rounded-lg shadow-md mb-6 p-6">
        <div className="border-b pb-4 mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6" />
            Expense History
          </h2>
        </div>
        
        <div className="mb-4">
          <select
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              setSelectedMonth(e.target.value ? new Date(e.target.value) : null);
            }}
            value={selectedMonth ? selectedMonth.toISOString().slice(0, 7) : ""}
          >
            <option value="">All Time</option>
            {getUniqueMonths().map((date) => (
              <option 
                key={date.toISOString()} 
                value={date.toISOString().slice(0, 7)}
              >
                {date.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>
        
        <MonthlyExpenseView 
          expenses={expenses}
          selectedMonth={selectedMonth}
          formatCurrency={formatCurrency}
          formatDateTime={formatDateTime}
        />
      </div>

      {/* Expense Summary */}
      <div className="bg-white rounded-lg shadow-md mb-6 p-6">
        <div className="border-b pb-4 mb-4">
          <h2 className="text-2xl font-bold">Expense Summary</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Total Expenses</h3>
            <p className="text-2xl font-bold">{formatCurrency(calculateTotalExpenses())}</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Per Person Share</h3>
            <div className="grid gap-2">
              {Object.entries(calculatePerPersonExpense()).map(([roommate, amount]) => (
                <div key={roommate} className="flex justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">{roommate}</span>
                  <span className="font-bold">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Settlements */}
      <ExpenseSettlements 
        expenses={expenses}
        roommates={roommates.filter(r => r)}
        settledPayments={settledPayments}
        onSettlePayment={(settlement) => {
          setSettledPayments(prev => [{
            ...settlement,
            timestamp: new Date(),
            status: 'settled'
          }, ...prev]);
        }}
        formatCurrency={formatCurrency}
        formatDateTime={formatDateTime}
      />
    </div>
  );
};

// MonthlyExpenseView Component
const MonthlyExpenseView = ({ expenses, selectedMonth, formatCurrency, formatDateTime }) => {
  const filteredExpenses = expenses.filter(expense => {
    if (!selectedMonth) return true;
    const expenseDate = new Date(expense.timestamp);
    return expenseDate.getMonth() === selectedMonth.getMonth() && 
           expenseDate.getFullYear() === selectedMonth.getFullYear();
  });

  const totalMonthlyExpense = filteredExpenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  );

  return (
    <div>
      <div className="text-xl font-bold mb-4">
        Total: {formatCurrency(totalMonthlyExpense)}
      </div>
      <div className="space-y-3">
        {filteredExpenses.map((expense) => (
          <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex flex-col">
              <span className="font-medium">{expense.description}</span>
              <span className="text-sm text-gray-500">
                Paid by {expense.paidBy} • Split among {expense.numberOfMembers} members
              </span>
              <span className="text-xs text-gray-400">
                {formatDateTime(expense.timestamp)}
              </span>
            </div>
            <span className="font-bold">{formatCurrency(expense.amount)}</span>
          </div>
        ))}
        {filteredExpenses.length === 0 && (
          <p className="text-gray-500 text-center">No expenses found for this period</p>
        )}
      </div>
    </div>
  );
};

// ExpenseSettlements Component
const ExpenseSettlements = ({ 
  expenses, 
  roommates, 
  settledPayments, 
  onSettlePayment,
  formatCurrency,
  formatDateTime
}) => {
  const calculateSettlements = () => {
    if (!expenses.length || !roommates.length) {
      return [];
    }

    const balances = {};
    roommates.forEach((roommate) => {
      balances[roommate] = 0;
    });

    // Calculate initial balances
    expenses.forEach((expense) => {
      if (!expense.paidBy || !expense.amount || !expense.numberOfMembers) return;

      const amount = Number(expense.amount);
      const splitAmount = amount / expense.numberOfMembers;

      balances[expense.paidBy] += amount;
      const involvedRoommates = roommates.slice(0, expense.numberOfMembers);
      involvedRoommates.forEach((roommate) => {
        balances[roommate] -= splitAmount;
      });
    });

    // Adjust balances based on settled payments
    settledPayments.forEach((settlement) => {
      balances[settlement.from] += settlement.amount;
      balances[settlement.to] -= settlement.amount;
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="border-b pb-4 mb-4">
        <h2 className="text-2xl font-bold">Settlements</h2>
      </div>

      {/* Pending Settlements */}
      <div className="space-y-3">
        {settlements.length > 0 ? (
          settlements.map((settlement, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-red-500">{settlement.from}</span>
                <span className="text-gray-600">needs to pay</span>
                <span className="font-medium text-green-500">{settlement.to}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">{formatCurrency(settlement.amount)}</span>
                <button
                  onClick={() => onSettlePayment(settlement)}
                  className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  title="Mark as settled"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Settle
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500 text-center p-4 bg-gray-50 rounded">
            No settlements needed - all expenses are settled!
          </div>
        )}
      </div>

      {/* Settlement History */}
      <div className="mt-8">
        <div className="border-b pb-4 mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="w-5 h-5" />
            Settlement History
          </h2>
        </div>
        <div className="space-y-3">
          {settledPayments.length > 0 ? (
            settledPayments.map((settlement, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600">{settlement.from}</span>
                  <span className="text-gray-500">paid</span>
                  <span className="font-medium text-gray-600">{settlement.to}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{formatCurrency(settlement.amount)}</span>
                  <span className="text-sm text-gray-500">
                    {formatDateTime(settlement.timestamp)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center p-4 bg-gray-50 rounded">
              No settlement history yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoommateExpenses;
