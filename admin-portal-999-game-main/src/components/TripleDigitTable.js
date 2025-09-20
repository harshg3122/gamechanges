import React from "react";
import axios from "axios";
import { Alert } from "react-bootstrap";

const TripleDigitTable = ({
  triples,
  date,
  timeSlot,
  onResultDeclared,
  showAlert,
}) => {
  const handleDeclare = async (tripleDigitNumber) => {
    try {
      const res = await axios.post("/api/results/declare", {
        date,
        timeSlot,
        tripleDigitNumber,
      });

      if (showAlert) {
        showAlert(
          "success",
          res.data.message || "Result declared successfully!"
        );
      } else {
        alert("Result declared successfully!");
      }

      if (onResultDeclared) onResultDeclared(res.data.result);
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = "Error declaring result";

      if (errorData) {
        if (errorData.error === "Selected number is locked") {
          errorMessage =
            errorData.message ||
            "This number is locked and cannot be selected. Please choose another number.";
        } else if (errorData.error === "Resulting single digit is locked") {
          errorMessage =
            errorData.message ||
            "This number results in a locked single digit. Please choose another number.";
        } else if (
          errorData.error === "Result already declared for this round"
        ) {
          errorMessage = "A result has already been declared for this round.";
        } else {
          errorMessage =
            errorData.message || errorData.error || "Error declaring result";
        }
      }

      if (showAlert) {
        showAlert("danger", errorMessage);
      } else {
        alert(errorMessage);
      }

      console.error(
        "Error declaring result:",
        err.response?.data || err.message
      );
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
