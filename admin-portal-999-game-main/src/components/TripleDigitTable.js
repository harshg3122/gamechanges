import React from 'react';
import axios from 'axios';

const TripleDigitTable = ({ triples, date, timeSlot, onResultDeclared }) => {
  const handleDeclare = async (tripleDigitNumber) => {
    try {
      const res = await axios.post('/api/results/declare', {
        date,
        timeSlot,
        tripleDigitNumber
      });
      alert('Result declared!');
      if (onResultDeclared) onResultDeclared(res.data.result);
    } catch (err) {
      alert('Error declaring result: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <table>
      <thead>
        <tr>
          <th>Triple Digit</th>
          <th>Declare as Result</th>
        </tr>
      </thead>
      <tbody>
        {triples.map((triple) => (
          <tr key={triple.number}>
            <td>{triple.number}</td>
            <td>
              <button onClick={() => handleDeclare(triple.number)}>
                Declare as Result
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TripleDigitTable;
