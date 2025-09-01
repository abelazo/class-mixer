import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];
  // Remove header
  return lines.slice(1).map(line => line.split(','));
}

function parseFriendsCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];
  return lines.slice(1).map(line => {
    const cols = line.split(',');
    return {
      kid: cols[0].trim(),
      friends: cols.slice(1).map(f => f.trim()).filter(f => f),
    };
  });
}

function parseKidNamesCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];
  return lines.slice(1).map(line => line.split(',')[0].trim());
}

function shuffleArray(array) {
  // Fisher-Yates shuffle
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function assignGroups(kids, friendsList) {
  // Initial assignment: alternate to balance group sizes
  const group1 = [];
  const group2 = [];
  kids.forEach((kid, idx) => {
    if (group1.length <= group2.length) {
      group1.push(kid);
    } else {
      group2.push(kid);
    }
  });
  // Greedy maximize friends in same group
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < group1.length; i++) {
      for (let j = 0; j < group2.length; j++) {
        const k1 = group1[i];
        const k2 = group2[j];
        // Swap and compute score
        const newG1 = [...group1]; newG1[i] = k2;
        const newG2 = [...group2]; newG2[j] = k1;
        // Check group size difference
        if (Math.abs(newG1.length - newG2.length) > 1) continue;
        const scoreOld = groupScore(group1, friendsList) + groupScore(group2, friendsList);
        const scoreNew = groupScore(newG1, friendsList) + groupScore(newG2, friendsList);
        if (scoreNew > scoreOld) {
          group1[i] = k2;
          group2[j] = k1;
          improved = true;
        }
      }
    }
  }
  return [group1, group2];
}

function groupScore(group, friendsList) {
  let score = 0;
  for (const kid of group) {
    const entry = friendsList.find(f => f.kid === kid);
    if (!entry) continue;
    entry.friends.forEach((friend, idx) => {
      if (group.includes(friend)) score += (entry.friends.length - idx);
    });
  }
  return score;
}

function kidFriendshipScore(kid, group, friendsList) {
  const entry = friendsList.find(f => f.kid === kid);
  if (!entry) return 0;
  let score = 0;
  entry.friends.forEach((friend, idx) => {
    if (group.includes(friend)) {
      if (idx === 0) score += 3;
      else if (idx === 1) score += 2;
      else if (idx === 2) score += 1;
    }
  });
  return score;
}

function arePairPermutations(pairA, pairB) {
  // Check if group1/group2 in pairA is group2/group1 in pairB
  const a1 = [...pairA.group1].sort().join(',');
  const a2 = [...pairA.group2].sort().join(',');
  const b1 = [...pairB.group1].sort().join(',');
  const b2 = [...pairB.group2].sort().join(',');
  return (a1 === b1 && a2 === b2) || (a1 === b2 && a2 === b1);
}

function getTopUniquePairs(allKids, friendsList, numPairs = 100, topN = 3) {
  const pairs = [];
  for (let n = 0; n < numPairs; n++) {
    const shuffledKids = shuffleArray(allKids);
    const [g1, g2] = assignGroups(shuffledKids, friendsList);
    const pair = {
      group1: g1,
      group2: g2,
      score1: groupScore(g1, friendsList),
      score2: groupScore(g2, friendsList)
    };
    // Check for permutation duplicates
    if (!pairs.some(p => arePairPermutations(p, pair))) {
      pairs.push(pair);
    }
    // If we already have enough unique pairs, stop early
    if (pairs.length >= numPairs) break;
  }
  // Sort by total score descending
  pairs.sort((a, b) => (b.score1 + b.score2) - (a.score1 + a.score2));
  return pairs.slice(0, topN);
}

function App() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [file3, setFile3] = useState(null);
  const [list1, setList1] = useState([]);
  const [list2, setList2] = useState([]);
  const [list3, setList3] = useState([]);
  const [header1, setHeader1] = useState([]);
  const [header2, setHeader2] = useState([]);
  const [header3, setHeader3] = useState([]);
  const [error, setError] = useState('');
  const [groupPairs, setGroupPairs] = useState([]);
  const [friendsList, setFriendsList] = useState([]);

  const handleFile1Change = (e) => {
    setFile1(e.target.files[0]);
  };

  const handleFile2Change = (e) => {
    setFile2(e.target.files[0]);
  };

  const handleFile3Change = (e) => {
    setFile3(e.target.files[0]);
  };

  const handleSubmitAll = (e) => {
    e.preventDefault();
    setError('');
    if (!file1 || !file2 || !file3) {
      setError('Please select all three files before sending.');
      return;
    }
    const reader1 = new FileReader();
    const reader2 = new FileReader();
    const reader3 = new FileReader();

    reader1.onload = (ev) => {
      const kids1 = parseKidNamesCSV(ev.target.result);
      setHeader1(ev.target.result.split(/\r?\n/)[0].split(','));
      setList1(parseCSV(ev.target.result));
      reader2.onload = (ev2) => {
        const kids2 = parseKidNamesCSV(ev2.target.result);
        setHeader2(ev2.target.result.split(/\r?\n/)[0].split(','));
        setList2(parseCSV(ev2.target.result));
        reader3.onload = (ev3) => {
          setHeader3(ev3.target.result.split(/\r?\n/)[0].split(','));
          setList3(parseCSV(ev3.target.result));
          const fList = parseFriendsCSV(ev3.target.result);
          setFriendsList(fList);
          // Union of all kids from file1 and file2
          const kidSet = new Set([...kids1, ...kids2]);
          const allKids = Array.from(kidSet);
          // Generate 100 unique pairs, print top 3
          const topPairs = getTopUniquePairs(allKids, fList, 100, 3);
          setGroupPairs(topPairs);
        };
        reader3.onerror = () => setError('Error reading File 3.');
        reader3.readAsText(file3);
      };
      reader2.onerror = () => setError('Error reading File 2.');
      reader2.readAsText(file2);
    };
    reader1.onerror = () => setError('Error reading File 1.');
    reader1.readAsText(file1);
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h2>Send All Files</h2>
        <form onSubmit={handleSubmitAll} style={{ marginBottom: '2rem' }}>
          <label>
            Class 1:
            <input type="file" onChange={handleFile1Change} />
          </label>
          <label style={{ marginLeft: '1rem' }}>
            Class 2:
            <input type="file" onChange={handleFile2Change} />
          </label>
          <label style={{ marginLeft: '1rem' }}>
            Kids & Friends:
            <input type="file" onChange={handleFile3Change} />
          </label>
          <button type="submit" style={{ marginLeft: '1rem' }}>Send All Files</button>
        </form>
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
          <div>
            <h3>List from File 1</h3>
            {header1.length > 0 && (
              <table style={{ margin: '0 auto', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {header1.map((h, idx) => <th key={idx} style={{ border: '1px solid #ccc', padding: '4px' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {list1.map((row, idx) => (
                    <tr key={idx}>
                      {row.map((cell, cidx) => <td key={cidx} style={{ border: '1px solid #ccc', padding: '4px' }}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {header1.length === 0 && <div>No data</div>}
          </div>
          <div>
            <h3>List from File 2</h3>
            {header2.length > 0 && (
              <table style={{ margin: '0 auto', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {header2.map((h, idx) => <th key={idx} style={{ border: '1px solid #ccc', padding: '4px' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {list2.map((row, idx) => (
                    <tr key={idx}>
                      {row.map((cell, cidx) => <td key={cidx} style={{ border: '1px solid #ccc', padding: '4px' }}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {header2.length === 0 && <div>No data</div>}
          </div>
        </div>
        <div style={{ marginTop: '2rem' }}>
          <h3>List from File 3 (Kid & Friends)</h3>
          {header3.length > 0 && (
            <table style={{ margin: '0 auto', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {header3.map((h, idx) => <th key={idx} style={{ border: '1px solid #ccc', padding: '4px' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {list3.map((row, idx) => (
                  <tr key={idx}>
                    {row.map((cell, cidx) => <td key={cidx} style={{ border: '1px solid #ccc', padding: '4px' }}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {header3.length === 0 && <div>No data</div>}
        </div>
        <div style={{ marginTop: '2rem' }}>
          {groupPairs.map((pair, idx) => (
            <div key={idx} style={{ marginBottom: '2rem', border: '1px solid #ccc', padding: '1rem' }}>
              <h3>Pair {idx + 1}</h3>
              <div><strong>List 1</strong> (Total: {pair.group1.length}) Friendship Score: {pair.score1}</div>
              <ul>
                {pair.group1.map((kid, i) => (
                  <li key={i}>{kid} ({kidFriendshipScore(kid, pair.group1, friendsList)})</li>
                ))}
              </ul>
              <div><strong>List 2</strong> (Total: {pair.group2.length}) Friendship Score: {pair.score2}</div>
              <ul>
                {pair.group2.map((kid, i) => (
                  <li key={i}>{kid} ({kidFriendshipScore(kid, pair.group2, friendsList)})</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;
