'use client'

import { useState, useEffect } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField, IconButton} from '@mui/material'
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { db } from '@/firebase'
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
  increment,
} from 'firebase/firestore'
import { it } from 'node:test'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

interface inventoryItem {
  name: string;
  quantity: number;
}

export default function Home() {
  // We'll add our component logic here
  const [inventory, setInventory] = useState<inventoryItem[]>([])
  const [search, setSearch] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [filteredInv, setFilteredInv] = useState<inventoryItem[]>([]);

  
  const updateInventory = async () => {
    const snapshot = query(collection(db, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList : inventoryItem[] = []
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() } as inventoryItem) //confident that the data will be in the correct format
    })
    setInventory(inventoryList)
  }

  const addItem = async (item: string) => {
    console.log(item)
    const docRef = doc(collection(db, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      await incrementItem(item)
    } else {
      await setDoc(docRef, { quantity: 1 })
      await updateInventory()
    }
  }
  
  const incrementItem = async (item: string) => {
    const docRef = doc(collection(db, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      await setDoc(docRef, { quantity: docSnap.data().quantity + 1})
    }
    await updateInventory()
  }

  const decrementItem = async (item: string) => {
    const docRef = doc(collection(db, 'inventory'), item) // Create a reference to the document
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity === 1) {
        await removeItem(item)
      } else {
        await setDoc(docRef, { quantity: quantity - 1 })
        await updateInventory()
      }
    }
    else
      await updateInventory()
  }

  const removeItem = async (item: string) => { 
    const docRef = doc(collection(db, 'inventory'), item)
    await deleteDoc(docRef)
    await updateInventory()
  }
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  useEffect(() => {
    console.log(inventory);
  },[inventory])

  useEffect(() => {
    updateInventory()
  }, [])

  useEffect(() => {
    if (search === '') {
      setFilteredInv(inventory)
      return
    }
    setFilteredInv(inventory.filter(item => item.name.toLowerCase().includes(search.toLowerCase())))
  }, [inventory, search])

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      justifyContent="center"
      flexDirection="column"
      alignItems="center"
      gap={2}
      sx={{ backgroundColor: '#f5f5f5', padding: 4 }}
    >
      <TextField
        label="Search"
        variant="outlined"
        value={search}
        onChange={handleSearchChange}

        sx={{ marginBottom: 2, width: '50%' }}
      />
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Add Item
          </Typography>
          <Stack width="100%" direction={'row'} spacing={2}>
            <TextField
              id="outlined-basic"
              label="Item"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Button
              variant="outlined"
              onClick={() => {
                addItem(itemName)
                setItemName('')
                handleClose()
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Button variant="contained" onClick={handleOpen}>
        Add New Item
      </Button>
      <Box border={'1px solid #333'}>
        <Box
          width="800px"
          height="100px"
          bgcolor={'#ADD8E6'}
          display={'flex'}
          justifyContent={'center'}
          alignItems={'center'}
        >
          <Typography variant={'h2'} color={'#333'} textAlign={'center'}>
            Inventory Items
          </Typography>
        </Box>
        <Stack width="800px" height="300px" spacing={2} overflow={'auto'}>
          {filteredInv.map(({name, quantity}) => (
            <Box
              key={name}
              width="100%"
              minHeight="150px"
              display={'flex'}
              justifyContent={'space-between'}
              alignItems={'center'}
              bgcolor={'#f0f0f0'}
              paddingX={5}
            >
              <Typography variant={'h3'} color={'#333'} textAlign={'center'}>
                {name}
              </Typography>
              <Typography variant={'h3'} color={'#333'} textAlign={'center'}>
                Quantity: {quantity}
              </Typography>
              <Box display="flex" alignItems="center">
                <Box display="flex" flexDirection="column" gap={3}>
                  <IconButton onClick={() => incrementItem(name)}>
                    <AddIcon />
                  </IconButton>
                  <IconButton onClick={() => decrementItem(name)}>
                    <RemoveIcon />
                  </IconButton>
                </Box>
                <Box marginLeft={2}>
                  <Button variant="contained" onClick={() => removeItem(name)}>
                    Remove
                  </Button>
                </Box>
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}