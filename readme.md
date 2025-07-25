### 构建部署方式
#### 一、本地构建测试
1、终端进入docker目录，通过open -a docker 启动macos的docker desktop应用。
2、运行./dev_test.sh脚本，生成本地docker镜像并在docker desktop中运行。可以测试本地构建是否成功。
#### 二、生产环境构建
1、终端进入docker目录。
2、运行./prod_build.sh脚本，生成生产环境docker镜像，并推送到阿里镜像仓库。

#### 三服务器部署
1、进入阿里云轻量应用服务器，在myapp下创建应用目录。
2、将项目根目录的.env、db.sqlite3两个文件拷贝到服务器的应用目录下。
3、在服务器应用目录下创建docker目录，创建logs目录。
4、将deploy-server.sh、docker-compose.prod.yml脚本拷贝到docker下。
5、在docker目录下运行./deploy-server.sh脚本，会拉取镜像仓库镜像，并启动生产环境docker容器。

#### 四、访问应用
1、使用docker cp ./db.sqlite3 pass-backend-prod:/app/data/db.sqlite3 命令将服务器上的db.sqlite3文件拷贝到生产环境容器中。
2、在浏览器使用http://116.62.41.141:3000/ 访问前端



### 构建问题
1、拉取镜像失败：本地构建docker成功后，将代码提交到git仓库，服务器拉取代码进行构建，使用的是官方镜像源，导致拉取镜像失败，无法构建。配置服务器的镜像源无效。（不再服务器构建）
2、镜像架构错误：本地构建docker镜像后，推送镜像仓库，服务器直接拉取镜像运行，提示架构错误，无法运行。因为本地的macos和服务器的linux架构不一样。（添加多架构标记）
3、后端容器启动报错：修改了构建命令，后端容器启动成功，但查看后端容器日志，提示exec format error，说明架构还是有问题。（构建命令修改为docker buildx build）
4、镜像源问题：修改构建命令为buildx，使用新的建构器，结果构建时原有的国内景象源配置失效，导致拉取镜像失败。（为buildx创建的构建器配置国内镜像源）
5、后端服务无法读取sqlite文件：后端容器服务读取sqlite文件报错unable to open database file，修改文件的权限后依然无法从容器中读取服务器的文件。（将sqlite文件拷贝到容器中）
6、前端环境变量无效：前端在yml和env设置的VITE_API_BASE_URL无效，前端服务启动后无法识别，一直使用默认的http://localhost:8000/api。（在前端api.js里写死http://116.62.41.141:8000/api的后端服务地址）
7、前端报CORS错误：前端访问后端报错CORS错误，说明后端服务没有正确处理跨域请求。在后端的MIDDLEWARE汇总调整cors服务顺序，将CorsMiddleware放在其他服务之前。在CORS_ALLOWED_ORIGINS中增加http://116.62.41.141:3000的前端地址，允许前端访问后端服务。因为在yml和env中配置的环境变量没有生效，settings中没有使用这些变量。
