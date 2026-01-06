<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260103143601 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE student_test (id INT AUTO_INCREMENT NOT NULL, test_id INT NOT NULL, student_id INT NOT NULL, score DOUBLE PRECISION DEFAULT NULL, INDEX IDX_E75C05D41E5D0459 (test_id), INDEX IDX_E75C05D4CB944F1A (student_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE student_test ADD CONSTRAINT FK_E75C05D41E5D0459 FOREIGN KEY (test_id) REFERENCES test (id)');
        $this->addSql('ALTER TABLE student_test ADD CONSTRAINT FK_E75C05D4CB944F1A FOREIGN KEY (student_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE test DROP FOREIGN KEY FK_D87F7E0CCB944F1A');
        $this->addSql('DROP INDEX IDX_D87F7E0CCB944F1A ON test');
        $this->addSql('ALTER TABLE test DROP student_id, DROP score');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE student_test DROP FOREIGN KEY FK_E75C05D41E5D0459');
        $this->addSql('ALTER TABLE student_test DROP FOREIGN KEY FK_E75C05D4CB944F1A');
        $this->addSql('DROP TABLE student_test');
        $this->addSql('ALTER TABLE test ADD student_id INT DEFAULT NULL, ADD score DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('ALTER TABLE test ADD CONSTRAINT FK_D87F7E0CCB944F1A FOREIGN KEY (student_id) REFERENCES user (id)');
        $this->addSql('CREATE INDEX IDX_D87F7E0CCB944F1A ON test (student_id)');
    }
}
