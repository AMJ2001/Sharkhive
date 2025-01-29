<h1>$${\color{lightblue}SHARKHIVE}$$</h1>	
<h3>$${\color{orange}FILE \space PROJECT}$$</h3>	

## Overview
- **User Registration and Authentication** 
- **File system** 
- **Secure sharing and RBAC**

## Technologies
- **React/Redux:** For building UI and state management
- **Django:** For building the web apputilizing user authentication features.
- **SQLite:** For database management and file storage

## To run

```bash 
git clone https://github.com/AMJ2001/Sharkhive.git #clone this repository
```

```bash 
cd secure-file-share #go to the main project folder.
```

```bash 
mkcert --install mkcert localhost #generate certificate and key (pem files) for running https
```

```bash 
docker-compose up --build
```

In an unlikely case of a build failure, please try the following:<br>
  -> Generating new pem files again  <br>
  -> cd Frontend  <br>
     npm i  <br>
     cd ..  <br>
   docker-compose up --build  <br>
   docker-compose up </h6>

     
Once docker build is successfull, You can open the app on localhost:3000 (server at localhost:8000)

