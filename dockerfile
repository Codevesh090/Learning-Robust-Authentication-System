# Stage 1 :
# Builder stage = “How do I build my application?”
# In Builder stage , we actually "build" the image in which converting TypeScript to JavaScript happens only .
# But we cannot build our app without tsconfig.json and Typescrit devDependencies  and  in production we do not keep devDependencies . So, what we do , we firstly pass our app from builder stage where we use tsconfig and typescript devDependencies to build our app | means creating a image in which Typescript files is compiled to Javascript files using Typescript dependencies and tsconfig.json file .


# Give me an environment that already has Node.js 22 and Alpine Linux OS installed. 
FROM node:22-alpine AS builder

# Inside the container, make /app my application's working directory means create /app directory in the container. Now, all the commands after this like COPY , RUN , CMD etc.., will work relative to this /app directory means /app ke andar.
WORKDIR /app

# Copy package.json and package-lock.json files from the host machine to the container in /app directory.
COPY package*.json ./

# Install dev and production both dependencies inside the container that are specified in package.json and package-lock.json files means it will build the node_modules directory in container.
RUN npm ci

# Copy the rest of the application code like full src folder , from the host machine to the container in /app directory . COPY . . does NOT necessarily copy everything as it leaves the files present in .dockerignore .
COPY . .

# It runs the build script while building image defined in package.json to compile the TypeScript code into JavaScript.
RUN npm run build


# We builded the image with the compiled JavaScript code in /app/dist directory till this point ------------------------
# Yaani abhi tak ka image bana liya hai jo TypeScript code ko JavaScript mein compile kar raha hai.
# Till now we have a image with installed node and OS and dependencies(node_modules) and JavaScript (compiled from typescript code ).


#---------------------------------------------------------------------------------------------------------------------------


# Stage 2 :
# Runner stage = “What is the minimum environment required to run my application?”
# Runner stage : In runner stage , we just create a new image which is the final image that goes to production . In this image we keep our final elements like      Node 22  +  Alpine Linux OS  + node_modules + Javascript code from the builder image             and then we set the command that run this image in container                 node dist/server.js

# Installed Node version 22 and Alpine Linux
FROM node:22-alpine AS runner

# Set NODE_ENV to production to avoid installing dev dependencies in the runner stage.
ENV NODE_ENV=production

# Created a working directory /app in the runner stage.
WORKDIR /app

# Copied package.json and package-lock.json files from the host machine to the container in /app directory.
COPY package*.json ./

# Installed only production dependencies(node_modules) inside the container that are specified in package.json and package-lock.json files.
RUN npm ci --only=production

# Take the dist folder from the builder stage and copy it into the production stage.
COPY --from=builder /app/dist ./dist

# Expose port 3000 to the host machine.It does not automatically make your application accessible from the internet. Later when running docker run -p 3000:3000 we actually map the ports .
EXPOSE 3000

# This is the command executed when the container starts.
CMD ["node", "dist/server.js"]
