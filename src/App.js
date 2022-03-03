// App.js
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import "./App.css";
import abi from "./utils/WavePortal.json"
const App = () => {
  /* ユーザーのパブリックウォレットを保存するために使用する状態変数を定義します */
  const [currentAccount, setCurrentAccount] = useState("");
  const [messageValue, setMessageValue] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  console.log("currentAccount: ", currentAccount);

  const contractAddress = "0x4783493d5d6A849cd8E98f5A9d10b13b0d31b19b";
  const contractABI = abi.abi;
  /* window.ethereumにアクセスできることを確認します */
  const connectWallet = async () => {
	try {
		  const { ethereum } = window;
		  if (!ethereum) {
			  alert("Get MetaMask!")
			  return;
		  }
		  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
		  console.log("Connected: ", accounts[0]);
		  setCurrentAccount(accounts[0]);
	} catch (error) {
		console.log(error)
	}
  }
  const wave = async () => {
	  try {
		  const { ethereum } = window;
		  if (ethereum) {
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
			let count = await wavePortalContract.getTotalWaves();
			console.log("Retrieved total wave count...", count.toNumber());
			console.log("Signer:", signer);
			
			const waveTxn = await wavePortalContract.wave(messageValue,{gasLimit:300000})
			console.log("Mining...", waveTxn.hash);
			await waveTxn.wait();
			console.log("Mined --", waveTxn.hash);
			count = await wavePortalContract.getTotalWaves();
			console.log("Retrieved total wave count...", count.toNumber());
		  } else {
			  console.log("Ethreum object doesn't exist!");
		  }
	  } catch (error) {
		  console.log(error)
	}
  }
  const getAllWaves = async () => {
	  const {ethereum} = window;
	  
		try {
			if (ethereum){
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
				const waves = await wavePortalContract.getAllWaves();
				const wavesCleaned = waves.map(wave => {
					return {
						address: wave.waver,
						timestamp: new Date(wave.timestamp * 1000),
						message: wave.message,
					}
				})
				setAllWaves(wavesCleaned);
			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.log(error);
		}
	}
	const checkIfWalletIsConnected = async () => {
		try {
			const {ethereum} = window;
			if (!ethereum) {
				console.log("Make sure you have metamask !");
				return ;
			} else {
				console.log("We have the ethereum object", ethereum);
			}
			// ユーザーのウォレットへのアクセスが許可されているかどうかを確認
			const accounts = await ethereum.request({ method: "eth_accounts"});
			if (accounts.length !== 0) {
				const account = accounts[0];
				console.log("Found an authorized account:", account);
				setCurrentAccount(account)
				getAllWaves();
			} else {
				console.log("No authorized account found");
			}
		} catch (error) {
			console.log(error);
		}
	}
  /* WEBページがロードされたときに下記の関数を実行します */
  useEffect(() => {
	let wavePortalContract;
	
	const onNewWave = (from, timestamp, message) => {
		console.log("NewWave", from, timestamp, message);
		setAllWaves(prevState => [
			...prevState,
			{
				address: from,
				timestamp: new Date(timestamp * 1000),
				message: message,
			},
		]);
	};
	if (window.ethereum) {
		const provider = new ethers.providers.WebSocketProvider(window.ethereum);
		const signer = provider.getSigner();
		
		wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
		wavePortalContract.on("NewWave", onNewWave);
	}
	return () => {
		if (wavePortalContract) {
			wavePortalContract.off("NewWave", onNewWave)
		}
	}
  }, [])
  useEffect(() => {
	  checkIfWalletIsConnected();
  }, [])
  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
        <span role="img" aria-label="hand-wave">👋</span> WELCOME!
        </div>
        <div className="bio">
          イーサリアムウォレットを接続して、「<span role="img" aria-label="hand-wave">👋</span>(wave)」を送ってください<span role="img" aria-label="shine">✨</span>
        </div>
		{/* ウォレットコネクトのボタンを実装 */}
		{!currentAccount && (
			<button className="waveButton" onClick={connectWallet}>
				Connect Wallet
			</button>
		)}
		{currentAccount && (
			<button className="waveButton" onClick={connectWallet}>
				Wallet Connected
			</button>
		)}
		{currentAccount && (
			<button className="waveButton" onClick={wave}>
				Wave at Me
			</button>
		)}
		{currentAccount && (<textare name="messageArea"
			placeholder="メッセージはこちら"
			type="text"
			id="message"
			value={messageValue}
			onChange={e => setMessageValue(e.target.value)} />)
		}
		{/* 履歴を表示する */}
		{currentAccount && (
			allWaves.slice(0).reverse().map((wave, index) => {
				return (
					<div key={index} style={{ backgroundColor: "#F8F8FF", marginTop: "16px", padding: "8px"}}>
						<div>Address: {wave.address}</div>
						<div>Time: {wave.timestamp.toString()}</div>
						<div>Message: {wave.message}</div>
					</div>
				)
			})
			)
		}
      </div>
    </div>
  );
  }
export default App
