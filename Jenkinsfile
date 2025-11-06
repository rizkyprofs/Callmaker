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
                sh 'npm install'
            }
        }

        stage('Build Vue App') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t ${IMAGE_NAME} .'
            }
        }

        stage('Run Docker Container') {
            steps {
                script {
                    sh '''
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
