package com.genidocmobile

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                GeniDocApp()
            }
        }
    }
}

@Composable
fun GeniDocApp() {
    val navController = rememberNavController()
    var genidocId by remember { mutableStateOf("") }
    NavHost(navController = navController, startDestination = "login") {
        composable("login") {
            LoginScreen(
                onLoginSuccess = { id ->
                    genidocId = id
                    navController.navigate("card")
                },
                onRegister = { navController.navigate("register") }
            )
        }
        composable("register") {
            RegisterScreen(
                onRegisterSuccess = { id ->
                    genidocId = id
                    navController.navigate("card")
                },
                onBack = { navController.popBackStack() }
            )
        }
        composable("card") {
            PatientCardScreen(genidocId = genidocId, onLogout = {
                genidocId = ""
                navController.navigate("login") {
                    popUpTo("login") { inclusive = true }
                }
            })
        }
    }
}
                        put("password", password)
