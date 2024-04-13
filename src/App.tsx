import React, { useEffect, useState } from 'react';
import './App.css';
import { Button, Paper, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, child, set, update, get, push } from 'firebase/database';


import productsData from './assets/products/products.json';

const firebaseConfig = {
  apiKey: "AIzaSyDGMhOVVIVG91LmfhRSiqPi7hFHLB2ZIQA",
  authDomain: "mcwaste-5a78d.firebaseapp.com",
  projectId: "mcwaste-5a78d",
  storageBucket: "mcwaste-5a78d.appspot.com",
  messagingSenderId: "697314960666",
  appId: "1:697314960666:web:1f88f5dd37dc14fe1e78a3",
  measurementId: "G-QK3FJW33RE",
  databaseURL: "https://mcwaste-5a78d-default-rtdb.europe-west1.firebasedatabase.app"
};

const firebase = initializeApp(firebaseConfig);
const analytics = getAnalytics(firebase);
const database = getDatabase(firebase);

const actionHistoryDatabase = getDatabase(firebase);

const saveWasteItemToFirebase = async (date: string, wasteItems: { [itemName: string]: number }) => {
  try {
    // Construct the path for the table based on the date
    const tablePath = `wasteItems/${date}`;

    // Loop through each waste item
    for (const [itemName, amount] of Object.entries(wasteItems)) {
      // Check if the waste item already exists in the table
      const snapshot = await get(child(ref(database), `${tablePath}/${itemName}`));
      if (snapshot.exists()) {
        // If the waste item exists, update its amount by adding the new amount
        const currentAmount = snapshot.val().amount || 0;
        const newAmount = currentAmount + amount;
        await update(ref(database, `${tablePath}/${itemName}`), { amount: newAmount });
      } else {
        // If the waste item doesn't exist, create a new entry with the provided amount
        await set(ref(database, `${tablePath}/${itemName}`), { amount });
      }
    }

    // Save a single action to action history with all waste items and timestamp in HH:mm format
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const actionData = { date, wasteItems, timestamp };
    const actionRef = push(ref(actionHistoryDatabase, 'actions'));
    await set(actionRef, actionData);

    console.log('Waste items saved to Firebase successfully');
  } catch (error) {
    console.error('Error saving waste items to Firebase:', error);
  }
};


interface Product {
  name: string,
  systemName: string,
  imagePath: string
}

interface EdxtendedProduct extends Product {
  amount: number;
}

interface ImportedImages {
  [key: string]: any;
}

async function importImages(images: Product[]) {
  const importedImages: ImportedImages = {};
  for (const image of images) {
    importedImages[image.systemName] = await import(`./assets/images/${image.imagePath}`);
  }

  return importedImages;
}

const products: Product[] = productsData;

function App() {
  const amounts = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const categories = ['Обід', 'Меню', 'Десер.', 'Соуси', 'Напої', 'Інгр.'];
  const [selectedAmount, setSelectedAmount] = useState<string>('');
  const [images, setImages] = useState<ImportedImages>([]);
  const [wasteList, setWasteList] = useState<EdxtendedProduct[]>([]);


  useEffect(() => {
    importImages(products)
      .then(importedImages => {
        setImages(importedImages);
      })
      .catch(error => {
        console.error('Error importing images:', error);
      });
  }, []);

  const handleAddSelectedAmount = (amount: string) => {
    const newAmount = selectedAmount + amount;
    setSelectedAmount(newAmount);
  }

  const handleClearSelectedAmount = () => {
    setSelectedAmount('');
  }

  const handleAddToList = (product: Product) => {
    const amountToAdd = selectedAmount === '' ? 1 : +selectedAmount;

    const existingProductIndex = wasteList.findIndex(item => item.systemName === product.systemName);

    if (existingProductIndex === -1) {
      setWasteList(prevList => [...prevList, { ...product, amount: amountToAdd }]);
    } else {
      const updatedList = [...wasteList];
      updatedList[existingProductIndex].amount += amountToAdd;
      setWasteList(updatedList);
    }

    setSelectedAmount('');
  };

  const handleSaveToDatabase = () => {
    const currentDate = new Date().toISOString().split('T')[0];
    wasteList.forEach(async (wasteItem) => {
      try {
        await saveWasteItemToFirebase(currentDate, { [wasteItem.name]: wasteItem.amount });
        console.log(`Waste item "${wasteItem.name}" saved to Firebase successfully`);
      } catch (error) {
        console.error(`Error saving waste item "${wasteItem.name}" to Firebase:`, error);
      }
    });
    setWasteList([]);
  };

  return (
    <>
      <header className='header'>
        <div className='selected-amount' onClick={handleClearSelectedAmount}>
          <Paper
            elevation={3}
            sx={{
              width: '100px',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Кількість
            </Typography>
            <Typography variant="h4" component="p">
              {selectedAmount}
            </Typography>
          </Paper>
        </div>
        <div className='waste'>

          {!!wasteList.length && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Списано
              </Typography>
              <ul className="waste-list">
                {wasteList.map(wasteItem => (
                  <li>
                    {`${wasteItem.name}: ${wasteItem.amount}`}
                  </li>
                ))}
              </ul>
            </>
          )}

        </div>
      </header>
      <main className='main'>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around', marginBottom: '15px' }}>
          {amounts.map((item) => (
            <button
              className='amount-button'
              onClick={() => handleAddSelectedAmount(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '15px', gap: '20px' }}>
          {categories.map((item) => (
            <button
              className='menu-button'
              onClick={() => handleAddSelectedAmount(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="products">
          <ul className="product-list">


            {products.map(product => (
              <li className="product-item" key={product.systemName} onClick={() => handleAddToList(product)}>
                <img src={images[product.systemName]?.default} alt="asd" className="product-item__image" />
                <span className="product-item__title">
                  {product.name}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {!!wasteList.length && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveToDatabase}
            sx={{
              marginTop: '20px',
              fontSize: '12px',
              height: '40px',
            }}
          >
            Зберегти
          </Button>
        )}

      </main >
      <footer className='footer'>
        <div className='logout-block'>
          <span className='logout-email'>
            ua-00010.store@ua.mcd.com
          </span>
        </div>
      </footer>
    </>
  );
}

export default App;
