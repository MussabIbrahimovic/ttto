const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;
app.use(cors({
  origin: 'https://t0o0.vercel.app'  
}));
app.use(express.json());

app.post('/api/auth/register', (req, res) => {
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
