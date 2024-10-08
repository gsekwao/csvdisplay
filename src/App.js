import React, { useEffect, useState } from "react";
import axios from "axios";
import Papa from "papaparse";
import "./App.css";

function App() {
  const [csvData, setCsvData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [editIdx, setEditIdx] = useState(-1);
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState([]);
  const [selectedValue, setSelectedValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [btnIsClicked, setBtnIsClicked] = useState(false);
  const [showDropDown, setShowDropDown] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCSV = async () => {
      try {
        const response = await fetch("/data.csv");
        const text = await response.text();
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            setCsvData(result.data);
            setError(""); // Clear error on success
          },
          error: (err) => {
            setError(`Error parsing CSV file: ${err.message}`);
          },
        });
      } catch (err) {
        setError(`Error fetching CSV file: ${err.message}`);
      }
    };

    fetchCSV();
  }, []);

  const handleEdit = (idx) => {
    setEditIdx(idx);
  };

  const handleInputChange = (e, idx, key) => {
    const { value } = e.target;
    const updatedData = [...csvData];
    updatedData[idx][key] = value;
    setCsvData(updatedData);
  };

  const handleSave = () => {
    setEditIdx(-1);
  };

  const handleGetAnswer = async (e) => {
    e.preventDefault();
    setBtnIsClicked(true);
    setLoading(true);
    setShowDropDown(false);

    try {
      const response = await axios.post("http://104.198.142.20:8080/retrieve", {
        text: question,
      });

      setAnswers((prevAnswers) => [...prevAnswers, response.data]);
      setSelectedValue(response.data.candidates_retriever[0]?.name ?? "");
      setError("");
    } catch (err) {
      if (err.response) {
        setError(err.response.data);
      }
    } finally {
      setLoading(false);
      setShowDropDown(true);
      setBtnIsClicked(false);
    }
  };

  const handleFilteredData = (e) => {
    e.preventDefault();
    if (selectedFilter === "all") {
      setFilteredData(csvData);
    } else if (selectedFilter && selectedText) {
      const filtered = csvData.filter((item) => {
        return item[selectedFilter]
          ?.toString()
          .toLowerCase()
          .includes(selectedText.toLowerCase());
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(csvData);
    }
  };

  return (
    <div className="csv-container">
      <h2>Data App</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {csvData.length > 0 && (
        <div className="dropdown-container space">
          <div className="dropdown-content show">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              <option value="">Select a filter</option>
              <option value="all">All</option>
              {Object.keys(csvData[0]).map((key, idx) => (
                <option key={idx} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <form onSubmit={handleFilteredData}>
        <div className="form-group">
          <input
            type="text"
            value={selectedText}
            onChange={(e) => setSelectedText(e.target.value)}
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Filter</button>
      </form>
      {csvData.length > 0 && (
        <div className="table-container">
          <table className="styled-table">
            <thead>
              <tr>
                {Object.keys(csvData[0]).map((key, idx) => (
                  <th key={idx}>{key}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0
                ? filteredData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.keys(row).map((key, cellIndex) => (
                        <td key={cellIndex}>
                          {editIdx === rowIndex ? (
                            <input
                              type="text"
                              value={row[key]}
                              onChange={(e) =>
                                handleInputChange(e, rowIndex, key)
                              }
                            />
                          ) : (
                            row[key]
                          )}
                        </td>
                      ))}
                      <td>
                        {editIdx === rowIndex ? (
                          <button onClick={handleSave}>Save</button>
                        ) : (
                          <button onClick={() => handleEdit(rowIndex)}>
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                : csvData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.keys(row).map((key, cellIndex) => (
                        <td key={cellIndex}>
                          {editIdx === rowIndex ? (
                            <input
                              type="text"
                              value={row[key]}
                              onChange={(e) =>
                                handleInputChange(e, rowIndex, key)
                              }
                            />
                          ) : (
                            row[key]
                          )}
                        </td>
                      ))}
                      <td>
                        {editIdx === rowIndex ? (
                          <button onClick={handleSave}>Save</button>
                        ) : (
                          <button onClick={() => handleEdit(rowIndex)}>
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="input-container">
        <h1>Questions Answered</h1>

        <form onSubmit={handleGetAnswer}>
          <div className="form-group">
            <label>Question:</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit">Ask Question</button>
        </form>

        <h2>Answers List</h2>

        <div className="dropdown-container">
          <div className={`dropdown-content ${showDropDown ? "show" : ""}`}>
            {answers.length > 0 && (
              <select
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
              >
                {answers[0].candidates_retriever.map((item, index) => (
                  <option key={index} value={item.name ?? JSON.stringify(item)}>
                    {item.name ?? JSON.stringify(item)}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="loader">
            {loading && btnIsClicked && <div className="spinner"></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
