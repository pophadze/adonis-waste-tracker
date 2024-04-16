import React, { useEffect, useState } from 'react';
import '../App.css';
import { Button, Paper, Typography } from '@mui/material';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from 'firebase/database';
import axios from 'axios';
import cn from 'classnames';
import bun from '../assets/products/bun.png';
import { firebaseConfig } from '../firebaseConfig';

interface WasteItem {
  product: string;
  amount: number;
}



const firebase = initializeApp(firebaseConfig);
const database = getDatabase(firebase);
//const actionHistoryDatabase = getDatabase(firebase);

const saveWasteItemToFirebase = async (date: string, wasteItems: { [itemName: string]: number }) => {
  try {
    const tablePath = `wasteItems/${date}`;

    // Fetch existing counts from the server
    const snapshot = await get(ref(database, tablePath));
    const existingItems = snapshot.val() || {}; // If there are no existing items, initialize as an empty object

    // Update the counts with the new counts
    const updatedItems = { ...existingItems };
    for (const [itemName, amount] of Object.entries(wasteItems)) {
      updatedItems[itemName] = (updatedItems[itemName] || 0) + amount; // Add the new count to the existing count
    }

    // Set the updated counts to the server
    await set(ref(database, tablePath), updatedItems);

    console.log('Waste items saved to Firebase successfully');
  } catch (error) {
    console.error('Error saving waste items to Firebase:', error);
  }
};

const categories = ['Бургери', 'Снеки', 'Картопля', 'Соуси', 'Напої', 'Десерти', 'Інгредієнти'];
const categoriesImages = [
  'https://s7d1.scene7.com/is/image/mcdonalds/McD_burgers_roll_2023_160x160:category-panel-left-desktop',
  'https://s7d1.scene7.com/is/image/mcdonalds/nav_chicken_160x160:category-panel-left-desktop',
  'https://s7d1.scene7.com/is/image/mcdonalds/menu_frenchfries_160x160:category-panel-left-desktop',
  'https://s7d1.scene7.com/is/image/mcdonalds/nav_sauces_160x160:category-panel-left-desktop',
  'https://s7d1.scene7.com/is/image/mcdonalds/McD_drinks_2023_160x160:category-panel-left-desktop',
  'https://s7d1.scene7.com/is/image/mcdonalds/nav_desserts___shakes_160x160-1:category-panel-left-desktop',
  bun
];

function HomePage() {
  const amounts = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  const [selectedAmount, setSelectedAmount] = useState<string>('');
  const [wasteList, setWasteList] = useState<WasteItem[]>([]);
  const [menuItems, setMenuItems] = useState<[][] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);

  console.log(menuItems);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const SHEET_ID = '1jUjBdjUQhKcWLtoId41H5wb6wWovQt_7WP2BIKcHcnE';
        const API_KEY = 'AIzaSyDTXQTVuGPg-KXcc1EXXWr7Bmyin-CRaD8';

        const promises = categories.map(category => {
          const RANGE_NAME = `${category}!A1:B40`;
          return axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE_NAME}?key=${API_KEY}`);
        });

        const responses = await Promise.all(promises);
        const menuItems = responses.map(response => response.data.values);
        setMenuItems(menuItems);
      } catch (error) {
        console.error('Error fetching data from Google Sheet:', error);
      }
    };

    fetchData();
  }, []);


  const handleAddSelectedAmount = (amount: string) => {
    const newAmount = selectedAmount + amount;
    setSelectedAmount(newAmount);
  }

  const handleClearSelectedAmount = () => {
    setSelectedAmount('');
  }

  const handleAddToList = (product: string) => {
    const amountToAdd = selectedAmount === '' ? 1 : +selectedAmount;
    const modifiedProduct = selectedCategory === 6 ? `RW-${product}` : product;

    // Check if the product already exists in the waste list
    const existingItemIndex = wasteList.findIndex(item => item.product === modifiedProduct);

    if (existingItemIndex !== -1) {
      // If the product exists, create a new array with updated amounts
      setWasteList(prevList => {
        const updatedList = prevList.map((item, index) => {
          if (index === existingItemIndex) {
            // Update the amount for the existing product
            return { ...item, amount: item.amount + amountToAdd };
          }
          return item;
        });
        return updatedList;
      });
    } else {
      // If the product does not exist, add it to the waste list
      setWasteList(prevList => [...prevList, { product: modifiedProduct, amount: amountToAdd }]);
    }

    setSelectedAmount('');
  };


  const handleSaveToDatabase = async () => {
    try {
      const currentDate = new Date();
      const currentDay = currentDate.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' }).replace(/\./g, '-');
      const currentHour = currentDate.getHours();
      const currentMinute = currentDate.getMinutes();
      let shift;

      if ((currentHour < 14 && currentHour >= 5) || (currentHour === 14 && currentMinute < 30)) {
        shift = "1SH";
      } else {
        shift = "2SH";
      }

      for (const wasteItem of wasteList) {
        try {
          const result = `${currentDay} ${shift}`;
          await saveWasteItemToFirebase(result, { [wasteItem.product]: wasteItem.amount });
          console.log(`Waste item "${wasteItem.product}" saved to Firebase successfully`);
        } catch (error) {
          console.error(`Error saving waste item "${wasteItem.product}" to Firebase:`, error);
          // If an error occurs, return a rejected promise to handle it later
          return Promise.reject(error);
        }
      }

      // If all updates are successful, clear the waste list
      setWasteList([]);
      console.log('All waste items saved to Firebase successfully');
    } catch (error) {
      console.error('Error saving waste items to Firebase:', error);
    }
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

          {wasteList && !!wasteList.length && (
            <>
              <Typography variant="h6" gutterBottom>
                Списано:
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setWasteList([])}
                  sx={{
                    marginTop: '20px',
                    fontSize: '12px',
                    height: '40px',
                  }}
                >
                  Очистити
                </Button>
              </Typography>
              <ul className="waste-list">
                {wasteList.map(wasteItem => (
                  <li key={wasteItem.product} className="waste-item">
                    {`${wasteItem.product}: ${wasteItem.amount}`}
                  </li>
                ))}
              </ul>
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
          {selectedCategory === 6 && (
            <button
              className='amount-button'
              onClick={() => handleAddSelectedAmount('.')}
            >
              {'.'}
            </button>
          )}
        </div>

        <ul className='categories-list'>
          {categories.map((item, index) => (
            <li
              onClick={() => setSelectedCategory(index)}
              className={cn('categories-item', {
                'categories-item--active': index === selectedCategory,
              })}
              key={item}
            >
              <img
                src={categoriesImages[index]}
                alt={item}
                className='categories-image'
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="products">
          <ul className="product-list">
            {menuItems && menuItems[selectedCategory] && menuItems[selectedCategory].map(product => (
              <li className="product-item" key={product[0]} onClick={() => handleAddToList(product[0])}>
                <img src={product[1]} alt={product[0]} className="product-item__image" />
                <span className="product-item__title">
                  {product[0]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </main >
    </>
  );
}

export default HomePage;
