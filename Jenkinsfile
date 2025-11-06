pipeline {
    agent any

    environment {
        IMAGE_NAME = "callmaker"
        CONTAINER_NAME = "callmaker-container"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'master', url: 'https://github.com/rizkyprofs/Callmaker.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('Build Vue App') {
            steps {
                bat 'npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t ${IMAGE_NAME} .'
            }
        }

        stage('Run Docker Container') {
            steps {
                script {
                    bat '''
                    docker rm -f ${CONTAINER_NAME} || true
                    docker run -d -p 8080:80 --name ${CONTAINER_NAME} ${IMAGE_NAME}
                    '''
                }
            }
        }
    }

    post {
        success {
            echo '✅ Build & Deploy berhasil!'
        }
        failure {
            echo '❌ Build gagal, periksa log.'
        }
    }
}
