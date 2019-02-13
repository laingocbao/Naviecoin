# Naivecoin: chapter 4

```
npm install
node main.js
```

##### Lấy toàn bộ blockchain
```
Dùng Postman, phương thức GET: http://localhost:3001/blocks
```

##### Đào block
```
Dùng Postman, phương thức POST: http://localhost:3001/mineBlock.
``` 

##### Tạo transaction
```
Dùng Postman, phương thức POST: http://localhost:3001/mineTransaction. 
Trong phần body sử dụng mode raw (Định dạng JSON): {"address": "04bfcab8722991ae774db48f934ca79cfb7dd991229153b9f732ba5334aafcd8e7266e47076996b55a14bf9913ee3145ce0cfc1372ada8ada74bd287450313534b", "amount" : 35}
```

##### Lấy số dư tài khoản
```
Dùng Postman, phương thức GET: http://localhost:3001/balance
```
##### Thêm peer
```
Dùng Postman, phương thức POST: http://localhost:3001/addPeer. Trong phần body sử dụng mode raw (Định dạng JSON): {"peer" : "ws://localhost:6001"} 
```
#### Truy vấn các peer đã được kết nối
```
Dùng Postman, phương thức GET: http://localhost:3001/peers
```
