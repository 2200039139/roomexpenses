import React, { useState } from 'react';
import './RoommateExpenses.css';
import { PlusCircle, Edit2, Check, X } from 'lucide-react';

const ExpenseSettlements = ({ expenses = [], roommates = [] }) => {
  const calculateSettlements = () => {
    // Skip calculations if no data
    if (!expenses.length || !roommates.length) {
      return [];
    }

    // Filter out empty roommate names
    const activeRoommates = roommates.filter(roommate => roommate);
    
    if (activeRoommates.length === 0) {
      return [];
    }

    // Initialize balances for each roommate
    const balances = {};
    activeRoommates.forEach(roommate => {
      balances[roommate] = 0;
    });

    // Calculate net balance for each person
    expenses.forEach(expense => {
      if (!expense.paidBy || !expense.amount || !expense.numberOfMembers) return;
      
      const amount = Number(expense.amount);
      const splitAmount = amount / expense.numberOfMembers;
      
      // Add the full amount to the payer's balance
      balances[expense.paidBy] += amount;
      
      // Subtract the split amount from each person involved
      const involvedRoommates = activeRoommates.slice(0, expense.numberOfMembers);
      involvedRoommates.forEach(roommate => {
        balances[roommate] -= splitAmount;
      });
    });

    // Create settlements
    const settlements = [];
    const epsilon = 0.01; // To handle floating point precision

    while (true) {
      // Find max creditor and debtor
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

      // If no significant balances remain, we're done
      if (!maxCreditor || !maxDebtor) break;

      // Calculate settlement amount
      const settlementAmount = Math.min(maxCredit, maxDebt);
      
      if (settlementAmount > epsilon) {
        settlements.push({
          from: maxDebtor,
          to: maxCreditor,
          amount: Number(settlementAmount.toFixed(2))
        });

        // Update balances
        balances[maxCreditor] -= settlementAmount;
        balances[maxDebtor] += settlementAmount;
      } else {
        break;
      }
    }

    return settlements;
  };

  // Early return if no data
  if (!expenses?.length || !roommates?.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <div className="border-b pb-4 mb-4">
          <h2 className="text-2xl font-bold">Settlements</h2>
        </div>
        <p className="text-gray-500 text-center">Add some expenses and roommates to see settlements</p>
      </div>
    );
  }

  const settlements = calculateSettlements();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <div className="border-b pb-4 mb-4">
        <h2 className="text-2xl font-bold">Settlements</h2>
      </div>
      <div className="space-y-3">
        {settlements.length > 0 ? (
          settlements.map((settlement, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <span className="font-medium text-red-500">{settlement.from}</span>
                <span>needs to pay</span>
                <span className="font-medium text-green-500">{settlement.to}</span>
              </div>
              <span className="font-bold">₹{settlement.amount.toFixed(2)}</span>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">No settlements needed - all expenses are settled!</p>
        )}
      </div>
    </div>
  );
};

// Rest of the RoommateExpenses component remains the same
const RoommateExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [roommates, setRoommates] = useState(['']);
  const [editingExpense, setEditingExpense] = useState(null);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    paidBy: '',
    numberOfMembers: 0,
    timestamp: new Date()
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const addRoommate = () => {
    setRoommates([...roommates, '']);
  };

  const updateRoommate = (index, value) => {
    const updatedRoommates = [...roommates];
    updatedRoommates[index] = value;
    setRoommates(updatedRoommates);
  };

  const startEditing = (expense) => {
    setEditingExpense({ ...expense });
  };

  const cancelEditing = () => {
    setEditingExpense(null);
  };

  const saveEdit = () => {
    if (editingExpense) {
      setExpenses(expenses.map(expense => 
        expense.id === editingExpense.id ? editingExpense : expense
      ));
      setEditingExpense(null);
    }
  };

  const addExpense = () => {
    if (newExpense.description && newExpense.amount && newExpense.paidBy) {
      const activeMembers = roommates.filter(r => r).length;
      setExpenses([...expenses, { 
        ...newExpense, 
        id: Date.now(),
        numberOfMembers: activeMembers,
        timestamp: new Date()
      }]);
      setNewExpense({
        description: '',
        amount: '',
        paidBy: '',
        numberOfMembers: activeMembers,
        timestamp: new Date()
      });
    }
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  };

  const calculatePerPersonExpense = () => {
    const expenseShares = {};
    roommates.forEach(roommate => {
      if (roommate) {
        expenseShares[roommate] = 0;
      }
    });

    expenses.forEach(expense => {
      const perPersonAmount = Number(expense.amount) / expense.numberOfMembers;
      const expenseRoommates = roommates
        .filter(r => r)
        .slice(0, expense.numberOfMembers);
      
      expenseRoommates.forEach(roommate => {
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
                  roommate && <option key={index} value={roommate}>{roommate}</option>
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
            <p className="text-2xl font-bold">
              ₹{calculateTotalExpenses().toFixed(2)}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Per Person Share</h3>
            <div className="grid gap-2">
              {Object.entries(calculatePerPersonExpense()).map(([roommate, amount]) => (
                <div key={roommate} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{roommate}</span>
                  <span className="font-medium">₹{amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="border-b pb-4 mb-4">
          <h2 className="text-2xl font-bold">Expense History</h2>
        </div>
        <div className="space-y-2">
          {expenses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((expense) => (
            <div key={expense.id} className="p-2 border rounded">
              {editingExpense && editingExpense.id === expense.id ? (
                <div className="space-y-2">
                  <input
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingExpense.description}
                    onChange={(e) => setEditingExpense({
                      ...editingExpense,
                      description: e.target.value
                    })}
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-2">₹</span>
                    <input
                      type="number"
                      className="w-full p-2 pl-8 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingExpense.amount}
                      onChange={(e) => setEditingExpense({
                        ...editingExpense,
                        amount: e.target.value
                      })}
                    />
                  </div>
                  <select
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingExpense.paidBy}
                    onChange={(e) => setEditingExpense({
                      ...editingExpense,
                      paidBy: e.target.value
                    })}
                  >
                    {roommates.map((roommate, index) => (
                      roommate && <option key={index} value={roommate}>{roommate}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button 
                      onClick={saveEdit} 
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Save
                    </button>
                    <button 
                      onClick={cancelEditing} 
                      className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between">
                    <span className="font-medium">{expense.description}</span>
                    <div className="flex items-center gap-4">
                    <span>₹{Number(expense.amount).toFixed(2)}</span>
                      <button
                        onClick={() => startEditing(expense)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Paid by: {expense.paidBy} | Split between {expense.numberOfMembers} members
                  </div>
                  <div className="text-sm text-gray-500">
                    Added on: {formatDate(expense.timestamp)} at {formatTime(expense.timestamp)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <ExpenseSettlements expenses={expenses} roommates={roommates} />
    </div>
  );
};

export default RoommateExpenses;
