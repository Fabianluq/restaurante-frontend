import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../core/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage = signal<string | null>(null);
  loading = signal(false);

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
  this.loginForm = this.fb.group({ correo: ['', [Validators.required, Validators.email]], contrasenia: ['', Validators.required] });

  if (this.auth.isAuthenticated()) {
    void this.router.navigate(['/dashboard']);
  }
}



  get correo() { return this.loginForm.get('correo'); }
  get contrasenia() { return this.loginForm.get('contrasenia'); }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.loading.set(true);

    const payload: LoginRequest = {
      correo: this.loginForm.value.correo,
      contrasenia: this.loginForm.value.contrasenia
    };

    try {
      const res = await this.auth.login(payload);

      if (res?.token) {
        this.router.navigate(['/dashboard']);
        return;
      }

      this.errorMessage.set(res?.error ?? 'Error en el inicio de sesión.');
    } catch (err: any) {
      const message = err?.message ?? String(err);
      if (message.includes('401')) {
        this.errorMessage.set('Credenciales inválidas. Verifica tu correo y contraseña.');
      } else {
        this.errorMessage.set('Ocurrió un error. Intenta más tarde.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
