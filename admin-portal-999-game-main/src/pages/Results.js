import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Alert,
  Button,
  Spinner,
  Modal,
} from "react-bootstrap";
import {
  FaClock,
  FaGamepad,
  FaLock,
  FaUnlock,
  FaCoins,
  FaTrophy,
  FaUsers,
  FaChartLine,
  FaSync,
  FaPlay,
  FaStop,
  FaExclamationTriangle,
  FaEye,
} from "react-icons/fa";
import { gameAPI } from "../utils/api";
import { showAlert } from "../utils/helpers";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const Results = ({ roundId }) => {
  const [currentRound, setCurrentRound] = useState(null);
  const [resultTables, setResultTables] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState(null);
  const [roundWithBets, setRoundWithBets] = useState(null);
  const [showProfitModal, setShowProfitModal] = useState(false);
  const [profitNumbers, setProfitNumbers] = useState([]);
  const [result, setResult] = useState(null);
  const [profitLoading, setProfitLoading] = useState(false);
  const [profitError, setProfitError] = useState(null);
  const [declareLoading, setDeclareLoading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultsHistory, setResultsHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load data from API
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      setAlert(null);
      console.log("🔍 Fetching data...");

      // Fetch current round
      const roundResponse = await gameAPI.getCurrentRoundResults();
      console.log("📊 Round response:", roundResponse.data);

      if (roundResponse.data && roundResponse.data.success) {
        const roundData = roundResponse.data.data || roundResponse.data.round;
        setCurrentRound(roundData);

        // Always show current round's tables, even if empty
        if (roundData?._id) {
          try {
            const tablesResponse = await gameAPI.getResultTables(roundData._id);
            console.log(
              "📊 Tables response for current round:",
              tablesResponse.data
            );
            if (tablesResponse.data && tablesResponse.data.success) {
              const tables =
                tablesResponse.data.data || tablesResponse.data.tables;
              // If both tables are empty, show mock data
              if (
                (!tables.singleDigitTable ||
                  tables.singleDigitTable.length === 0) &&
                (!tables.tripleDigitTable ||
                  tables.tripleDigitTable.length === 0)
              ) {
                loadMockData();
              } else {
                setResultTables({
                  singleDigitTable: tables.singleDigitTable,
                  tripleDigitTable: tables.tripleDigitTable,
                  statistics: tables.statistics || {},
                });
              }
            } else {
              setResultTables({
                singleDigitTable: [],
                tripleDigitTable: [],
                statistics: {},
              });
            }
            setRoundWithBets(roundData);
          } catch (tablesError) {
            console.error(
              "Error fetching result tables for current round:",
              tablesError
            );
            setResultTables({
              singleDigitTable: [],
              tripleDigitTable: [],
              statistics: {},
            });
            setRoundWithBets(roundData);
          }
        }
      } else {
        console.error("Invalid round response structure:", roundResponse.data);
        // Load mock data for testing
        loadMockData();
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Load mock data for testing when API is not available
      loadMockData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Mock data for testing
  const loadMockData = () => {
    // Generate current time slot dynamically
    const now = new Date();
    const currentHour = now.getHours();
    const nextHour = (currentHour + 1) % 24;

    // Convert to 12-hour format with AM/PM
    const getCurrentTimeSlotWithAmPm = () => {
      const currentAmPm = currentHour >= 12 ? "PM" : "AM";
      const nextAmPm = nextHour >= 12 ? "PM" : "AM";
      const displayCurrentHour =
        currentHour > 12
          ? currentHour - 12
          : currentHour === 0
          ? 12
          : currentHour;
      const displayNextHour =
        nextHour > 12 ? nextHour - 12 : nextHour === 0 ? 12 : nextHour;

      return `${displayCurrentHour}:00 ${currentAmPm} - ${displayNextHour}:00 ${nextAmPm}`;
    };

    const mockCurrentRound = {
      _id: "674e1234567890abcd123456",
      timeSlot: getCurrentTimeSlotWithAmPm(),
      gameClass: "A",
      status: "BETTING_OPEN",
      timing: {
        gameStatus: "BETTING_OPEN",
        remainingMinutes: 60 - now.getMinutes(), // Actual remaining minutes
      },
    };

    const mockResultTables = {
      statistics: {
        totalBets: 250,
        totalBetAmount: 45000,
        lockedSingleDigitEntries: 5,
        totalSingleDigitEntries: 10,
        lockedTripleDigitEntries: 12,
        totalTripleDigitEntries: 15,
      },
      singleDigitTable: [
        { number: 0, tokens: 5200, lock: false },
        { number: 1, tokens: 4800, lock: true },
        { number: 2, tokens: 3600, lock: false },
        { number: 3, tokens: 6100, lock: true },
        { number: 4, tokens: 2900, lock: true },
        { number: 5, tokens: 4200, lock: false },
        { number: 6, tokens: 3800, lock: true },
        { number: 7, tokens: 5500, lock: true },
        { number: 8, tokens: 4000, lock: false },
        { number: 9, tokens: 4900, lock: false },
      ],
      tripleDigitTable: [
        {
          number: 987,
          classType: "A",
          tokens: 1680,
          sumDigits: 24,
          onesDigit: 4,
          lock: true,
        },
        {
          number: 654,
          classType: "C",
          tokens: 1420,
          sumDigits: 15,
          onesDigit: 5,
          lock: true,
        },
        {
          number: 789,
          classType: "A",
          tokens: 1500,
          sumDigits: 24,
          onesDigit: 4,
          lock: true,
        },
        {
          number: 890,
          classType: "A",
          tokens: 1350,
          sumDigits: 17,
          onesDigit: 7,
          lock: true,
        },
        {
          number: 432,
          classType: "B",
          tokens: 1280,
          sumDigits: 9,
          onesDigit: 9,
          lock: true,
        },
        {
          number: 123,
          classType: "A",
          tokens: 1200,
          sumDigits: 6,
          onesDigit: 6,
          lock: true,
        },
        {
          number: 198,
          classType: "A",
          tokens: 1150,
          sumDigits: 18,
          onesDigit: 8,
          lock: true,
        },
        {
          number: 567,
          classType: "B",
          tokens: 1100,
          sumDigits: 18,
          onesDigit: 8,
          lock: true,
        },
        {
          number: 678,
          classType: "C",
          tokens: 1050,
          sumDigits: 21,
          onesDigit: 1,
          lock: true,
        },
        {
          number: 765,
          classType: "C",
          tokens: 950,
          sumDigits: 18,
          onesDigit: 8,
          lock: true,
        },
        {
          number: 345,
          classType: "B",
          tokens: 920,
          sumDigits: 12,
          onesDigit: 2,
          lock: true,
        },
        {
          number: 456,
          classType: "B",
          tokens: 980,
          sumDigits: 15,
          onesDigit: 5,
          lock: true,
        },
        {
          number: 321,
          classType: "B",
          tokens: 870,
          sumDigits: 6,
          onesDigit: 6,
          lock: false,
        },
        {
          number: 901,
          classType: "A",
          tokens: 800,
          sumDigits: 10,
          onesDigit: 0,
          lock: false,
        },
        {
          number: 234,
          classType: "C",
          tokens: 750,
          sumDigits: 9,
          onesDigit: 9,
          lock: false,
        },
      ],
    };

    setCurrentRound(mockCurrentRound);
    setResultTables(mockResultTables);
    showAlert(
      setAlert,
      "info",
      "Showing demo data. Connect to backend for live results."
    );
  };

  // Auto refresh every 30 seconds and check for auto-declaration
  useEffect(() => {
    fetchData();
    fetchResultsHistory();

    const interval = setInterval(() => {
      fetchData();

      // Check if we're in the last 10 minutes and should auto-declare
      if (isInLastTenMinutes() && !result) {
        fetchResult(); // This will trigger auto-declaration if needed
      }
    }, 30000);

    // Update current time every second and refresh data every minute to update time slot
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Update time slot every minute
    const slotInterval = setInterval(() => {
      fetchData(); // This will update the time slot display
    }, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
      clearInterval(slotInterval);
    };
  }, [fetchData, result]);

  const handleRefresh = () => {
    fetchData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "BETTING_OPEN":
      case "ACTIVE":
      case "active":
        return "success";
      case "ADMIN_PERIOD":
      case "admin":
        return "warning";
      case "CLOSED":
      case "closed":
        return "danger";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "BETTING_OPEN":
      case "ACTIVE":
      case "active":
        return <FaPlay />;
      case "ADMIN_PERIOD":
      case "admin":
        return <FaTrophy />;
      case "CLOSED":
      case "closed":
        return <FaStop />;
      default:
        return <FaClock />;
    }
  };

  // Helper to get slot start time from timeSlot string
  const getSlotStartTime = (timeSlotStr) => {
    // Example timeSlotStr: "4:00 PM - 4:50 PM"
    if (!timeSlotStr) return null;
    const match = timeSlotStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    const now = new Date();
    const slotStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      minute,
      0,
      0
    );
    // If slotStart is in the future (e.g. after midnight), subtract a day
    if (slotStart > now) slotStart.setDate(slotStart.getDate() - 1);
    return slotStart;
  };

  // Get current time slot based on actual current time
  const getCurrentTimeSlot = () => {
    const now = new Date();
    const currentHour = now.getHours(); // 24-hour format
    const nextHour = (currentHour + 1) % 24;

    // Convert to 12-hour format for display
    const displayCurrentHour =
      currentHour > 12
        ? currentHour - 12
        : currentHour === 0
        ? 12
        : currentHour;
    const displayNextHour =
      nextHour > 12 ? nextHour - 12 : nextHour === 0 ? 12 : nextHour;

    return `${displayCurrentHour}-${displayNextHour}`;
  };

  // Format time slot to show current hour range
  const formatTimeSlot = (timeSlotStr) => {
    // Always show current time slot regardless of input
    return getCurrentTimeSlot();
  };

  // Only show button after 50 minutes from slot start
  const canShowViewResult = () => {
    if (!currentRound?.timeSlot) return false;
    const slotStart = getSlotStartTime(currentRound.timeSlot);
    if (!slotStart) return false;
    const now = new Date();
    const diffMinutes = (now - slotStart) / (1000 * 60);

    // Show view result button after 50 minutes
    return diffMinutes >= 50;
  };

  // Check if we're in the last 10 minutes of the slot for auto-declaration
  const isInLastTenMinutes = () => {
    if (!currentRound?.timeSlot) return false;
    const match = currentRound.timeSlot.match(
      /-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i
    );
    if (!match) return false;

    let endHour = parseInt(match[1], 10);
    const endMinute = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();

    if (ampm === "PM" && endHour !== 12) endHour += 12;
    if (ampm === "AM" && endHour === 12) endHour = 0;

    const now = new Date();
    const slotEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      endHour,
      endMinute,
      0,
      0
    );

    // If slotEnd is in the past (e.g., after midnight), add a day
    if (slotEnd < now && now.getHours() - endHour > 2)
      slotEnd.setDate(slotEnd.getDate() + 1);

    const diffMinutes = (slotEnd - now) / (1000 * 60);
    return diffMinutes <= 10 && diffMinutes >= 0;
  };

  // Fetch profit numbers
  const fetchProfitNumbers = async () => {
    setViewLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/results/profit-numbers`, {
        params: { roundId },
      });
      if (res.data.success) {
        setProfitNumbers(res.data.profitNumbers);
      } else {
        setError(res.data.message || "Failed to fetch profit numbers");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch profit numbers");
    }
    setViewLoading(false);
  };

  // Fetch declared result
  const fetchResult = async () => {
    setViewLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/results/view`, {
        params: { roundId },
      });
      if (res.data.success) {
        setResult(res.data.result);
        // If result was auto-declared, show a notification
        if (res.data.autoDeclared) {
          showAlert(
            setAlert,
            "info",
            "Result was automatically declared by the system"
          );
        }
      } else {
        setResult(null);
        // Check if we're in the last 10 minutes and should auto-declare
        if (isInLastTenMinutes()) {
          // Try to auto-declare result
          await handleAutoDeclareResult();
        } else {
          setError(res.data.message || "No result declared yet");
        }
      }
    } catch (err) {
      setResult(null);
      setError(err.response?.data?.message || "No result declared yet");
    }
    setViewLoading(false);
  };

  // Auto-declare result in the last minute
  const handleAutoDeclareResult = async () => {
    try {
      // Only auto-declare in the last minute
      if (!isInLastMinute()) {
        return;
      }

      // Find an unlocked triple digit that would result in an unlocked single digit
      let validTripleDigit = null;
      const unlockedTripleDigits =
        resultTables?.tripleDigitTable?.filter((item) => !item.lock) || [];

      for (const tripleDigit of unlockedTripleDigits) {
        const resultCalc = calculateResultFromTripleDigit(tripleDigit.number);
        if (!resultCalc.isLocked) {
          validTripleDigit = tripleDigit;
          break;
        }
      }

      if (validTripleDigit) {
        await handleDeclareResult(validTripleDigit.number, true); // true = system auto-declaration
        showAlert(
          setAlert,
          "success",
          "Result automatically declared by the system"
        );
      } else {
        setError("No unlocked triple digits available for auto-declaration");
      }
    } catch (err) {
      console.error("Error auto-declaring result:", err);
      setError("Failed to auto-declare result");
    }
  };

  // Check if we're in the first 50 minutes (no result declaration allowed)
  const isInFirstFiftyMinutes = () => {
    if (!currentRound?.timeSlot) return false;
    const match = currentRound.timeSlot.match(
      /-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i
    );
    if (!match) return false;

    let endHour = parseInt(match[1], 10);
    const endMinute = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();

    if (ampm === "PM" && endHour !== 12) endHour += 12;
    if (ampm === "AM" && endHour === 12) endHour = 0;

    const now = new Date();
    const slotEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      endHour,
      endMinute,
      0,
      0
    );

    // If slotEnd is in the past (e.g., after midnight), add a day
    if (slotEnd < now && now.getHours() - endHour > 2)
      slotEnd.setDate(slotEnd.getDate() + 1);

    const diffMinutes = (slotEnd - now) / (1000 * 60);
    return diffMinutes > 10; // More than 10 minutes remaining = first 50 minutes
  };

  // Check if we're in the last minute (system auto-declaration time)
  const isInLastMinute = () => {
    if (!currentRound?.timeSlot) return false;
    const match = currentRound.timeSlot.match(
      /-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i
    );
    if (!match) return false;

    let endHour = parseInt(match[1], 10);
    const endMinute = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();

    if (ampm === "PM" && endHour !== 12) endHour += 12;
    if (ampm === "AM" && endHour === 12) endHour = 0;

    const now = new Date();
    const slotEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      endHour,
      endMinute,
      0,
      0
    );

    // If slotEnd is in the past (e.g., after midnight), add a day
    if (slotEnd < now && now.getHours() - endHour > 2)
      slotEnd.setDate(slotEnd.getDate() + 1);

    const diffMinutes = (slotEnd - now) / (1000 * 60);
    return diffMinutes <= 1 && diffMinutes >= 0; // Last minute
  };

  // Declare result
  const handleDeclareResult = async (
    tripleDigitNumber,
    isSystemAutoDeclaration = false
  ) => {
    setDeclareLoading(true);
    setError("");

    try {
      // Check timing constraints (unless it's system auto-declaration)
      if (!isSystemAutoDeclaration) {
        if (isInFirstFiftyMinutes()) {
          const errorMsg =
            "Result declaration not allowed in the first 50 minutes. Please wait for the last 10 minutes.";
          setError(errorMsg);
          showAlert(setAlert, "warning", errorMsg);
          setDeclareLoading(false);
          return;
        }
      }

      // Try backend call first to get proper validation
      try {
        const res = await axios.post(`${API_BASE}/results/declare`, {
          roundId: currentRound?._id,
          tripleDigitNumber,
        });

        if (res.data.success) {
          setResult(res.data.result);

          // Calculate result for display
          const resultCalc = calculateResultFromTripleDigit(tripleDigitNumber);

          showAlert(
            setAlert,
            "success",
            res.data.message ||
              `Result declared successfully: Triple digit ${tripleDigitNumber} (Sum: ${resultCalc.sum}, Single digit: ${resultCalc.lastDigit})`
          );

          setShowProfitModal(true); // Show the result popup after declaring

          // Refresh the data to show updated status
          await fetchData();
        }
      } catch (backendError) {
        // Handle backend errors with proper popup messages
        const errorData = backendError.response?.data;
        let errorMessage = "Error declaring result";

        if (errorData) {
          if (errorData.error === "Selected number is locked") {
            errorMessage =
              errorData.message ||
              `This number is locked and cannot be selected. Please choose another number.`;
          } else if (errorData.error === "Resulting single digit is locked") {
            errorMessage =
              errorData.message ||
              `This number results in a locked single digit. Please choose another number.`;
          } else if (
            errorData.error === "Result already declared for this round"
          ) {
            errorMessage = "A result has already been declared for this round.";
          } else {
            errorMessage =
              errorData.message || errorData.error || "Error declaring result";
          }
        }

        setError(errorMessage);
        showAlert(setAlert, "danger", errorMessage);

        console.error(
          "Backend error:",
          backendError.response?.data || backendError.message
        );

        // Fallback to client-side validation if backend is not available
        if (backendError.code === "NETWORK_ERROR" || !backendError.response) {
          console.log("Backend not available, using client-side validation");

          // Check if the selected triple digit is locked
          const selectedTripleDigit = resultTables?.tripleDigitTable?.find(
            (item) => item.number === tripleDigitNumber
          );

          if (selectedTripleDigit?.lock) {
            const lockError = `Cannot declare result: Triple digit ${tripleDigitNumber} is locked. Please choose another number.`;
            setError(lockError);
            showAlert(setAlert, "danger", lockError);
            setDeclareLoading(false);
            return;
          }

          // First check if the triple digit is valid for result declaration
          const resultCalc = calculateResultFromTripleDigit(tripleDigitNumber);

          // If the resulting single digit is locked, show error
          if (resultCalc.isLocked) {
            const digitError = `Cannot declare result: The sum ${resultCalc.sum} results in digit ${resultCalc.lastDigit} which is locked. Please choose another number.`;
            setError(digitError);
            showAlert(setAlert, "danger", digitError);
            setDeclareLoading(false);
            return;
          }

          // For demo purposes, create a mock result since backend is not connected
          const mockResult = {
            tripleDigitNumber: tripleDigitNumber.toString(),
            singleDigitResult: resultCalc.lastDigit.toString(),
            declaredAt: new Date().toISOString(),
            roundId: currentRound?._id || "mock-round-id",
          };

          setResult(mockResult);

          showAlert(
            setAlert,
            "info",
            `Mock result declared: Triple digit ${tripleDigitNumber} (Sum: ${resultCalc.sum}, Single digit: ${resultCalc.lastDigit}) - Backend not available`
          );

          setShowProfitModal(true);
        }
      }
    } catch (err) {
      const genericError = "Unexpected error occurred while declaring result";
      setError(genericError);
      showAlert(setAlert, "danger", genericError);
      console.error("Unexpected error:", err);
    }
    setDeclareLoading(false);
  };

  // Fetch results history for the table
  const fetchResultsHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await axios.get("/api/game/results");
      setResultsHistory(res.data || []);
    } catch (err) {
      setHistoryError(
        err?.response?.data?.message || "Failed to fetch results history"
      );
      setResultsHistory([]);
    }
    setHistoryLoading(false);
  };

  // Calculate sum of triple digit and check if last digit is in single digit table
  const calculateResultFromTripleDigit = (tripleDigit) => {
    // Convert to string to handle leading zeros
    const tripleStr = tripleDigit.toString().padStart(3, "0");

    // Calculate sum of digits
    const sum = tripleStr
      .split("")
      .reduce((acc, digit) => acc + parseInt(digit, 10), 0);

    // Get last digit of sum
    const lastDigit = sum % 10;

    // Check if this digit is locked in single digit table
    const isLocked = resultTables?.singleDigitTable?.find(
      (item) => item.number === lastDigit && item.lock
    );

    return {
      sum,
      lastDigit,
      isLocked: !!isLocked,
    };
  };

  useEffect(() => {
    if (roundId) {
      fetchProfitNumbers();
      fetchResult();
    }
  }, [roundId]);

  // Fetch and show result in modal
  const handleViewResult = async () => {
    setProfitLoading(true);
    setProfitError(null);
    try {
      // If we have a result, show it
      if (result) {
        setShowProfitModal(true);
      } else {
        // Try to fetch from backend, but use mock data if not available
        try {
          await fetchResult();
        } catch (err) {
          // Show modal anyway for demo purposes
          setProfitError("No result declared yet for this round");
        }
        setShowProfitModal(true);
      }
    } catch (err) {
      setProfitError(err?.message || "Failed to fetch result");
      setShowProfitModal(true);
    }
    setProfitLoading(false);
  };

  if (loading) {
    return (
      <Container fluid className="p-4">
        <div className="text-center py-5">
          <Spinner
            animation="border"
            variant="primary"
            style={{ width: "3rem", height: "3rem" }}
          />
          <p className="mt-3 h5">Loading Results...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="p-4">
      {/* Alert */}
      {alert && (
        <Alert
          variant={alert.type}
          dismissible
          onClose={() => setAlert(null)}
          className="mb-4"
        >
          {alert.message}
        </Alert>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">
            <FaChartLine className="me-3 text-primary" />
            Live Results Dashboard
          </h2>
          <p className="text-muted mb-0">
            Real-time game results and statistics
          </p>
          <small className="text-info">
            <FaClock className="me-1" />
            Current Time (IST):{" "}
            {currentTime.toLocaleTimeString("en-IN", {
              timeZone: "Asia/Kolkata",
              hour12: true,
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
            })}
            {" | Current Slot: "}
            <strong>{getCurrentTimeSlot()}</strong>
          </small>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FaSync
              className={refreshing ? "spinner-border spinner-border-sm" : ""}
            />
            {refreshing ? " Updating..." : " Refresh"}
          </Button>
          <Button
            variant="success"
            onClick={handleViewResult}
            disabled={viewLoading}
          >
            <FaEye
              className={
                viewLoading ? "spinner-border spinner-border-sm me-1" : "me-2"
              }
            />
            View Result
          </Button>
        </div>
      </div>

      {/* Current Round Status */}
      {currentRound && (
        <Card className="mb-4 shadow-sm">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FaGamepad className="me-2" />
              <h5 className="mb-0">Current Round</h5>
              <Badge bg="info" className="ms-2">
                #{currentRound._id?.slice(-6) || "N/A"}
              </Badge>
            </div>
            <Badge
              bg={getStatusColor(
                currentRound.timing?.gameStatus || currentRound.status
              )}
              className="d-flex align-items-center"
            >
              {getStatusIcon(
                currentRound.timing?.gameStatus || currentRound.status
              )}
              <span className="ms-1">
                {currentRound.timing?.gameStatus ||
                  currentRound.status ||
                  "ACTIVE"}
              </span>
            </Badge>
          </Card.Header>

          <Card.Body>
            <Row>
              <Col md={2}>
                <div className="text-center">
                  <FaClock className="text-primary mb-2" size={20} />
                  <div className="fw-bold">
                    {formatTimeSlot(currentRound.timeSlot) || "N/A"}
                  </div>
                  <small className="text-muted">Time Slot</small>
                </div>
              </Col>
              <Col md={2}>
                <div className="text-center">
                  <FaGamepad className="text-success mb-2" size={20} />
                  <div className="fw-bold">
                    <Badge bg="success">
                      {currentRound.gameClass || "Standard"}
                    </Badge>
                  </div>
                  <small className="text-muted">Game Class</small>
                </div>
              </Col>
              <Col md={2}>
                <div className="text-center">
                  <FaUsers className="text-info mb-2" size={20} />
                  <div className="fw-bold">
                    {resultTables?.statistics?.totalBets || 0}
                  </div>
                  <small className="text-muted">Total Bets</small>
                </div>
              </Col>
              <Col md={2}>
                <div className="text-center">
                  <FaCoins className="text-warning mb-2" size={20} />
                  <div className="fw-bold">
                    ₹{resultTables?.statistics?.totalBetAmount || 0}
                  </div>
                  <small className="text-muted">Total Amount</small>
                </div>
              </Col>
              {currentRound.timing && (
                <Col md={2}>
                  <div className="text-center">
                    <FaClock className="text-danger mb-2" size={20} />
                    <div className="fw-bold">
                      {currentRound.timing.remainingMinutes || 0} min
                    </div>
                    <small className="text-muted">Remaining</small>
                  </div>
                </Col>
              )}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Results Tables */}
      {resultTables && (
        <Row className="mb-4">
          {/* Single Digit Table */}
          <Col lg={6} className="mb-4">
            <Card className="shadow-sm h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <FaTrophy className="me-2 text-warning" />
                  <h5 className="mb-0">Single Digit Table</h5>
                  {roundWithBets && roundWithBets._id !== currentRound?._id && (
                    <Badge bg="warning" className="ms-2">
                      Previous Round Data
                    </Badge>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <Badge bg="danger">
                    <FaLock className="me-1" />
                    {resultTables.statistics?.lockedSingleDigitEntries ||
                      0}{" "}
                    Locked
                  </Badge>
                  <Badge bg="info">
                    <FaUsers className="me-1" />
                    {resultTables.statistics?.totalSingleDigitEntries || 0}{" "}
                    Total
                  </Badge>
                </div>
              </Card.Header>

              <Card.Body className="p-0">
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  <Table responsive hover className="mb-0">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>Number</th>
                        <th>Tokens</th>
                        {/* Removed Status column */}
                      </tr>
                    </thead>
                    <tbody>
                      {(resultTables.singleDigitTable || [])
                        .sort((a, b) => (b.tokens || 0) - (a.tokens || 0))
                        .map((item, index) => (
                          <tr
                            key={item.number || index}
                            className={
                              item.lock
                                ? "table-danger"
                                : item.tokens > 0
                                ? "table-success"
                                : ""
                            }
                          >
                            <td>
                              <Badge bg="primary" className="fw-bold">
                                {item.number}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <FaCoins className="me-2 text-warning" />
                                <span className="fw-bold">
                                  ₹{item.tokens || 0}
                                </span>
                              </div>
                            </td>
                            {/* Removed Status cell */}
                          </tr>
                        ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Triple Digit Table */}
          <Col lg={6} className="mb-4">
            <Card className="shadow-sm h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <FaGamepad className="me-2 text-primary" />
                  <h5 className="mb-0">Triple Digit Table</h5>
                  {roundWithBets && roundWithBets._id !== currentRound?._id && (
                    <Badge bg="warning" className="ms-2">
                      Previous Round Data
                    </Badge>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <Badge bg="danger">
                    <FaLock className="me-1" />
                    {resultTables.statistics?.lockedTripleDigitEntries ||
                      0}{" "}
                    Locked
                  </Badge>
                  <Badge bg="info">
                    <FaUsers className="me-1" />
                    {resultTables.statistics?.totalTripleDigitEntries || 0}{" "}
                    Total
                  </Badge>
                </div>
              </Card.Header>

              <Card.Body className="p-0">
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  <Table responsive hover className="mb-0">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>Number</th>
                        <th>Class</th>
                        <th>Tokens</th>
                        <th>Sum</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(resultTables.tripleDigitTable || [])
                        .sort((a, b) => {
                          // Sort by tokens (descending) - highest tokens first
                          return (b.tokens || 0) - (a.tokens || 0);
                        })
                        .map((item, index) => (
                          <tr
                            key={item.number || index}
                            className={
                              item.lock
                                ? "table-danger"
                                : item.tokens > 0
                                ? "table-success"
                                : ""
                            }
                          >
                            <td>
                              <Badge bg="info" className="fw-bold">
                                {item.number}
                              </Badge>
                            </td>
                            <td>
                              <Badge
                                bg={
                                  item.classType === "A"
                                    ? "success"
                                    : item.classType === "B"
                                    ? "warning"
                                    : "secondary"
                                }
                              >
                                {item.classType || "N/A"}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <FaCoins className="me-2 text-warning" />
                                <span className="fw-bold">
                                  ₹{item.tokens || 0}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className="fw-bold">
                                {item.sumDigits || 0}
                              </span>
                              {item.onesDigit !== undefined && (
                                <small className="text-muted">
                                  {" "}
                                  ({item.onesDigit})
                                </small>
                              )}
                            </td>
                            <td>
                              {item.lock ? (
                                <Badge bg="danger">
                                  <FaLock className="me-1" /> Locked
                                </Badge>
                              ) : (
                                <Button
                                  variant="success"
                                  size="sm"
                                  disabled={
                                    isInFirstFiftyMinutes() || declareLoading
                                  }
                                  onClick={() => {
                                    handleDeclareResult(item.number);
                                  }}
                                  title={
                                    isInFirstFiftyMinutes()
                                      ? "Result declaration available in last 10 minutes"
                                      : "Click to declare as result"
                                  }
                                >
                                  {declareLoading ? (
                                    <Spinner animation="border" size="sm" />
                                  ) : (
                                    "Declare as Result"
                                  )}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      {(!resultTables.tripleDigitTable ||
                        resultTables.tripleDigitTable.length === 0) && (
                        <tr>
                          <td
                            colSpan="5"
                            className="text-center text-muted py-4"
                          >
                            <FaExclamationTriangle className="me-2" />
                            No triple digit bets placed yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Summary Stats */}
      {resultTables && (
        <Row>
          <Col md={3}>
            <Card className="text-center border-primary">
              <Card.Body>
                <FaUsers className="display-4 text-primary mb-2" />
                <h4>{resultTables.statistics?.totalBets || 0}</h4>
                <p className="text-muted mb-0">Total Bets</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-success">
              <Card.Body>
                <FaCoins className="display-4 text-success mb-2" />
                <h4>₹{resultTables.statistics?.totalBetAmount || 0}</h4>
                <p className="text-muted mb-0">Total Amount</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-warning">
              <Card.Body>
                <FaLock className="display-4 text-warning mb-2" />
                <h4>
                  {(resultTables.statistics?.lockedTripleDigitEntries || 0) +
                    (resultTables.statistics?.lockedSingleDigitEntries || 0)}
                </h4>
                <p className="text-muted mb-0">Locked Numbers</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-info">
              <Card.Body>
                <FaChartLine className="display-4 text-info mb-2" />
                <h4>
                  {resultTables.statistics?.totalTripleDigitEntries > 0
                    ? Math.round(
                        ((resultTables.statistics?.lockedTripleDigitEntries ||
                          0) /
                          resultTables.statistics.totalTripleDigitEntries) *
                          100
                      )
                    : 0}
                  %
                </h4>
                <p className="text-muted mb-0">Lock Rate</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* No Data Message */}
      {!currentRound && !loading && !alert && (
        <Card className="text-center py-5">
          <Card.Body>
            <FaExclamationTriangle size={60} className="text-muted mb-3" />
            <h4 className="text-muted">No Active Round</h4>
            <p className="text-muted">
              There is no active game round at the moment.
            </p>
            <Button variant="primary" onClick={handleRefresh}>
              <FaSync className="me-2" />
              Check Again
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* Result Modal */}
      <Modal
        show={showProfitModal}
        onHide={() => setShowProfitModal(false)}
        centered
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaTrophy className="me-2" />
            Game Result
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {profitLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading result data...</p>
            </div>
          ) : profitError ? (
            <Alert variant="danger">{profitError}</Alert>
          ) : !result ? (
            <Alert variant="warning" className="text-center">
              <FaExclamationTriangle className="me-2" />
              No result has been declared yet for this round.
            </Alert>
          ) : (
            <>
              <div className="text-center mb-4">
                <h3 className="mb-4">Round Result</h3>
                <Row>
                  <Col md={6} className="mb-3">
                    <Card className="bg-light">
                      <Card.Body className="text-center">
                        <h5 className="text-muted mb-2">Triple Digit Result</h5>
                        <h2 className="display-4 fw-bold text-primary">
                          {result.tripleDigitNumber}
                        </h2>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Card className="bg-light">
                      <Card.Body className="text-center">
                        <h5 className="text-muted mb-2">Single Digit Result</h5>
                        <h2 className="display-4 fw-bold text-success">
                          {result.singleDigitResult}
                        </h2>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>

              <h5 className="mb-3">Profit Analysis</h5>
              <Table striped bordered hover responsive>
                <thead className="bg-light">
                  <tr>
                    <th>Number</th>
                    <th>Tokens</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {profitNumbers.map((item) => (
                    <tr key={item.number}>
                      <td>
                        <Badge bg="info">{item.number}</Badge>
                      </td>
                      <td>
                        <FaCoins className="text-warning me-1" /> {item.tokens}
                      </td>
                      <td>
                        {item.locked ? (
                          <Badge bg="danger">
                            <FaLock className="me-1" /> Locked
                          </Badge>
                        ) : (
                          <Badge bg="success">
                            <FaUnlock className="me-1" /> Available
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!profitNumbers || profitNumbers.length === 0) && (
                    <tr>
                      <td colSpan="3" className="text-center py-3 text-muted">
                        No profit data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProfitModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Results History Table */}
      {currentRound && resultTables && (
        <Card className="mt-4">
          <Card.Header>
            <h5 className="mb-0">Results History</h5>
          </Card.Header>
          <Card.Body>
            <Table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Single Digit</th>
                  <th>Triple Digit</th>
                </tr>
              </thead>
              <tbody>
                {resultsHistory.map((result) => (
                  <tr key={result._id}>
                    <td>{formatDate(result.declaredAt)}</td>
                    <td>{result.timeSlot}</td>
                    <td>{result.singleDigit}</td>
                    <td>{result.tripleDigit}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Results;
