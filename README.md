# Naivecoin: chapter 2

```
npm install
npm start
```

##### Lấy blockchain
```
Dùng Postman, phương thức GET: http://localhost:3001/blocks
```

##### Tạo block
```
Dùng Postman, phương thức POST: http://localhost:3001/mineBlock. Trong phần body sử dụng mode raw (Định dạng JSON): {"data" : "Some data to the first block"}
``` 

##### Thêm peer
```
Dùng Postman, phương thức POST: http://localhost:3001/addPeer. Trong phần body sử dụng mode raw (Định dạng JSON): {"peer" : "ws://localhost:6001"} 
```
#### Truy vấn các peer đã được kết nối
```
Dùng Postman, phương thức GET: http://localhost:3001/peers